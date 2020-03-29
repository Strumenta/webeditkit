import { getDatamodelRoot, ModelNode, NodeId } from './datamodel';
import { renderDataModels } from './webeditkit';

/**
 * TODO use the one in ModelNode
 */
function findNode(root, searchedID) {
  if (root.id.regularId === searchedID.regularId) {
    return root;
  } else {
    for (let i = 0; i < root.children.length; i++) {
      const res = findNode(root.children[i], searchedID);
      if (res != null) {
        return res;
      }
    }
    return null;
  }
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class WsCommunication {
  private ws: WebSocket;
  private modelName: string;
  private localName: string;
  private readonly callbacks: {};

  constructor(url, modelName, localName) {
    this.ws = new WebSocket(url);
    this.modelName = modelName;
    this.localName = localName;
    this.callbacks = {};

    const thisWS = this;

    this.ws.onopen = (event) => {
      thisWS.registerForChangesInModel(modelName);
    };

    this.ws.onmessage = (event) => {
      console.info('onmessage', event);
      const data = JSON.parse(event.data);
      console.info('  data: ', data);
      if (data.type === 'propertyChange') {
        const root = getDatamodelRoot(localName);
        const node = findNode(root.data, data.nodeId);
        node.properties[data.propertyName] = data.propertyValue;
        renderDataModels();
      } else if (data.type === 'nodeAdded') {
        const root = getDatamodelRoot(localName);
        const parentNode = findNode(root.data, data.parentNodeId);
        new ModelNode(parentNode).addChild(data.relationName, data.index, data.child);
        renderDataModels();
      } else if (data.type === 'nodeRemoved') {
        const root = getDatamodelRoot(localName);
        const parentNode = findNode(root.data, data.parentNodeId);
        new ModelNode(parentNode).removeChild(data.relationName, data.child);
        renderDataModels();
      } else if (data.type === 'AnswerAlternatives') {
        const alternativesReceiver = thisWS.callbacks[data.requestId];
        alternativesReceiver(data.items);
      } else if (data.type === 'AnswerDefaultInsertion') {
        const reactorToInsertion = thisWS.callbacks[data.requestId] as (addedNodeID: NodeId) => void;
        reactorToInsertion(data.addedNodeID);
      } else {
        console.warn('data', data);
        throw new Error('Unknown change type: ' + data.type);
      }
    };
  }

  sendJSON(data) {
    this.ws.send(JSON.stringify(data));
  }

  registerForChangesInModel(modelName) {
    this.sendJSON({
      type: 'registerForChanges',
      modelName,
    });
  }

  instantiate(conceptName, nodeToReplace) {
    this.sendJSON({
      type: 'instantiateConcept',
      modelName: nodeToReplace.modelName(),
      conceptToInstantiate: conceptName,
      nodeToReplace: nodeToReplace.idString(),
    });
  }

  triggerDefaultInsertion(container, containmentName, reactorToInsertion: (addedNodeID: NodeId) => void) {
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

  addChild(container, containmentName, conceptName) {
    this.sendJSON({
      type: 'addChild',
      modelName: container.modelName(),
      container: container.idString(),
      containmentName,
      conceptToInstantiate: conceptName,
    });
  }

  addChildAtIndex(container, containmentName, index: number, conceptName?: string) {
    this.sendJSON({
      type: 'addChild',
      index,
      modelName: container.modelName(),
      container: container.idString(),
      containmentName,
      conceptToInstantiate: conceptName,
    });
  }

  insertNextSibling(sibling: ModelNode) {
    this.sendJSON({
      type: 'insertNextSibling',
      modelName: sibling.modelName(),
      sibling: sibling.idString(),
    });
  }

  setChild(container, containmentName, conceptName) {
    this.sendJSON({
      type: 'setChild',
      modelName: container.modelName(),
      container: container.idString(),
      containmentName,
      conceptToInstantiate: conceptName,
    });
  }

  deleteNode(node) {
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

  askAlternatives(modelNode, containmentName, alternativesReceiver) {
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

export function getWsCommunication(modelName) {
  return instances[modelName];
}

export function createInstance(url, modelName, localName) {
  const instance = new WsCommunication(url, modelName, localName);
  instances[modelName] = instance;
}
