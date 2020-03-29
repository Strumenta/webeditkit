import {findNode, getDatamodelRoot, ModelNode, NodeId, PropertyType, dataToNode, nodeIdToString} from './datamodel';
import { renderDataModels } from './webeditkit';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class WsCommunication {
  private ws: WebSocket;
  private modelName: string; // This is the qualified model name
  private localName: string; // This is the local model name or target
  private silent: boolean;
  private readonly callbacks: {};

  constructor(url: string, modelName: string, localName: string, ws?: WebSocket) {
    this.ws = ws || new WebSocket(url);
    this.modelName = modelName;
    this.localName = localName;
    this.callbacks = {};
    this.silent = false;

    const thisWS = this;

    this.ws.onopen = (event) => {
      thisWS.registerForChangesInModel(modelName);
    };

    this.ws.onmessage = (event) => {
      if (!this.silent) {
        console.info('onmessage', event);
      }
      const data = JSON.parse(event.data);
      if (!this.silent) {
        console.info('  data: ', data);
      }
      if (data.type === 'propertyChange') {
        const root = getDatamodelRoot(localName);
        if (root == null) {
          throw new Error('data model with local name ' + localName + ' was not found');
        }
        const node = dataToNode(root.data).findNodeById(nodeIdToString(data.nodeId));
        node.setProperty(data.propertyName as string, data.propertyValue as PropertyType);
        renderDataModels();
      } else if (data.type === 'nodeAdded') {
        const root = getDatamodelRoot(localName);
        if (root == null) {
          throw new Error('data model with local name ' + localName + ' was not found');
        }
        const parentNode = dataToNode(root.data).findNodeById(nodeIdToString(data.parentNodeId));
        if (parentNode == null) {
          throw new Error('Cannot add node because parent was not found. ID was: ' + JSON.stringify(data.parentNodeId));
        }
        parentNode.addChild(data.relationName, data.index, data.child);
        renderDataModels();
      } else if (data.type === 'nodeRemoved') {
        const root = getDatamodelRoot(localName);
        if (root == null) {
          throw new Error('data model with local name ' + localName + ' was not found');
        }
        const parentNode = dataToNode(root.data).findNodeById(nodeIdToString(data.parentNodeId));
        if (parentNode == null) {
          throw new Error('Cannot remove node because parent was not found');
        }
        parentNode.removeChild(data.relationName, data.child);
        renderDataModels();
      } else if (data.type === 'AnswerAlternatives') {
        const alternativesReceiver = thisWS.callbacks[data.requestId];
        alternativesReceiver(data.items);
      } else if (data.type === 'AnswerDefaultInsertion') {
        const reactorToInsertion = thisWS.callbacks[data.requestId] as (addedNodeID: NodeId) => void;
        reactorToInsertion(data.addedNodeID);
      } else {
        if (!this.silent) {
          console.warn('data', data);
        }
        throw new Error('Unknown message type: ' + data.type);
      }
    };
  }

  setSilent() {
    this.silent = true;
  }

  private sendJSON(data) {
    this.ws.send(JSON.stringify(data));
  }

  private registerForChangesInModel(modelName: string) : void {
    this.sendJSON({
      type: 'registerForChanges',
      modelName,
    });
  }

  instantiate(conceptName: string, nodeToReplace: ModelNode) : void {
    this.sendJSON({
      type: 'instantiateConcept',
      modelName: nodeToReplace.modelName(),
      conceptToInstantiate: conceptName,
      nodeToReplace: nodeToReplace.idString(),
    });
  }

  triggerDefaultInsertion(container, containmentName, reactorToInsertion: (addedNodeID: NodeId) => void) : void {
    const uuid = uuidv4();
    this.callbacks[uuid] = reactorToInsertion;
    this.sendJSON({
      type: 'defaultInsertion',
      modelName: container.modelName(),
      container: container.idString(),
      requestId: uuid,
      containmentName,
    });
  }

  addChild(container: ModelNode, containmentName: string, conceptName: string) : void {
    this.addChildAtIndex(container, containmentName, -1, conceptName);
  }

  addChildAtIndex(container, containmentName, index: number, conceptName: string) : void {
    if (index < -1) {
      throw new Error("Index should -1 to indicate to add at the end, or a value >= 0")
    }
    this.sendJSON({
      type: 'addChild',
      index,
      modelName: container.modelName(),
      container: container.idString(),
      containmentName,
      conceptToInstantiate: conceptName,
    });
  }

  insertNextSibling(sibling: ModelNode) : void {
    this.sendJSON({
      type: 'insertNextSibling',
      modelName: sibling.modelName(),
      sibling: sibling.idString(),
    });
  }

  setChild(container: ModelNode, containmentName: string, conceptName: string) : void {
    this.sendJSON({
      type: 'setChild',
      modelName: container.modelName(),
      container: container.idString(),
      containmentName,
      conceptToInstantiate: conceptName,
    });
  }

  deleteNode(node) : void {
    this.sendJSON({
      type: 'deleteNode',
      modelName: node.modelName(),
      node: node.idString(),
    });
  }

  triggerChangeOnPropertyNode(modelNode, propertyName, propertyValue) {
    this.sendJSON({
      type: 'propertyChange',
      nodeId: modelNode.idString(),
      modelName: modelNode.modelName(),
      propertyName,
      propertyValue,
    });
  }

  askAlternatives(modelNode: ModelNode, containmentName: string, alternativesReceiver) {
    // we generate a UUID and ask the server to answer us using such UUID
    const uuid = uuidv4();
    this.callbacks[uuid] = alternativesReceiver;
    this.sendJSON({
      type: 'askAlternatives',
      requestId: uuid,
      modelName: modelNode.modelName(),
      nodeId: modelNode.idString(),
      containmentName: containmentName,
    });
  }
}

const instances = {};

export function getWsCommunication(modelName: string) {
  return instances[modelName];
}

export function createInstance(url: string, modelName: string, localName: string) {
  const instance = new WsCommunication(url, modelName, localName);
  instances[modelName] = instance;
}
