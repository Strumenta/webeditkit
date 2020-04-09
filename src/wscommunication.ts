import {
  dataToNode,
  getDatamodelRoot,
  NodeData,
  NodeId,
  nodeIdToString,
  NodeInModel,
  PropertiesValues,
  PropertyType,
} from './datamodel/misc';
import { renderDataModels } from './webeditkit';
import { uuidv4 } from './misc';
import { ModelNode } from './datamodel/modelNode';
import { Ref } from './datamodel/ref';

///
/// Messages - start
///

interface Message {
  type: string;
}

interface PropertyChange extends Message {
  propertyName: string;
  propertyValue: PropertyType;
  nodeId: NodeId;
}

interface ReferenceChange extends Message {
  node: NodeInModel;
  referenceName: string;
  referenceValue: NodeInModel;
}

interface NodeAdded extends Message {
  parentNodeId: NodeId;
  relationName: string;
  index: number;
  child: NodeData;
}

interface NodeRemoved extends Message {
  parentNodeId: NodeId;
  relationName: string;
  child: NodeData;
}

///
/// Messages - end
///

export interface Alternative {
  conceptName: string;
  alias: string;
}

export interface AlternativeForDirectReference {
  label: string;
  modelName: string;
  nodeId: NodeId;
}

export type Alternatives = Alternative[];
export type AlternativesForDirectReference = AlternativeForDirectReference[];

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
    this.silent = true;

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
        const msg = data as PropertyChange;
        const root = getDatamodelRoot(localName);
        if (root == null) {
          throw new Error('data model with local name ' + localName + ' was not found');
        }
        const node = dataToNode(root.data).findNodeById(nodeIdToString(msg.nodeId));
        node.setProperty(msg.propertyName, msg.propertyValue);
        renderDataModels();
      } else if (data.type === 'ReferenceChange') {
        const msg = data as ReferenceChange;
        const root = getDatamodelRoot(localName);
        if (root == null) {
          throw new Error('data model with local name ' + localName + ' was not found');
        }
        const node = dataToNode(root.data).findNodeById(nodeIdToString(msg.node.id));
        if (msg.referenceValue == null) {
          node.setRefLocally(msg.referenceName, null);
        } else {
          node.setRefLocally(msg.referenceName, new Ref({
            model: {qualifiedName: msg.referenceValue.model},
            id: msg.referenceValue.id
          }));
        }
        renderDataModels();
      } else if (data.type === 'nodeAdded') {
        const msg = data as NodeAdded;
        const root = getDatamodelRoot(localName);
        if (msg.parentNodeId == null) {
          // this is a new root
        } else {
          if (root == null) {
            throw new Error('data model with local name ' + localName + ' was not found');
          }
          const parentNode = dataToNode(root.data).findNodeById(nodeIdToString(msg.parentNodeId));
          if (parentNode == null) {
            throw new Error('Cannot add node because parent was not found. ID was: ' + JSON.stringify(msg.parentNodeId));
          }
          parentNode.addChild(msg.relationName, msg.index, msg.child);
        }
        renderDataModels();
      } else if (data.type === 'nodeRemoved') {
        const msg = data as NodeRemoved;
        const root = getDatamodelRoot(localName);
        if (msg.parentNodeId == null) {
          // this is a root
        } else {
          if (root == null) {
            throw new Error('data model with local name ' + localName + ' was not found');
          }
          const parentNode = dataToNode(root.data).findNodeById(nodeIdToString(msg.parentNodeId));
          if (parentNode == null) {
            throw new Error('Cannot remove node because parent was not found');
          }
          parentNode.removeChild(msg.relationName, msg.child);
        }
        renderDataModels();
      } else if (data.type === 'AnswerAlternatives') {
        const alternativesReceiver = thisWS.callbacks[data.requestId];
        alternativesReceiver(data.items);
      } else if (data.type === 'AnswerDefaultInsertion') {
        const reactorToInsertion = thisWS.callbacks[data.requestId] as (addedNodeID: NodeId) => void;
        if (reactorToInsertion == null) {
          throw new Error('No callback for default insertion');
        }
        reactorToInsertion(data.addedNodeID);
      } else if (data.type === 'AnswerForDirectReferences') {
        const cb = thisWS.callbacks[data.requestId];
        cb(data.items);
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

  setVerbose() {
    this.silent = false;
  }

  createRoot(modelName: string, conceptName: string, propertiesValues: PropertiesValues) : void {
    this.sendJSON({
      type: 'createRoot',
      modelName,
      conceptName,
      propertiesValues
    });
  }

  private sendJSON(data) {
    this.ws.send(JSON.stringify(data));
  }

  private registerForChangesInModel(modelName: string): void {
    this.sendJSON({
      type: 'registerForChanges',
      modelName,
    });
  }

  instantiate(conceptName: string, nodeToReplace: ModelNode): void {
    this.sendJSON({
      type: 'instantiateConcept',
      modelName: nodeToReplace.modelName(),
      conceptToInstantiate: conceptName,
      nodeToReplace: nodeToReplace.idString(),
    });
  }

  triggerDefaultInsertion(
    container,
    containmentName,
    reactorToInsertion: (addedNodeID: NodeId) => void,
    uuid: string = uuidv4(),
  ): void {
    this.callbacks[uuid] = reactorToInsertion;
    this.sendJSON({
      type: 'defaultInsertion',
      modelName: container.modelName(),
      container: container.idString(),
      requestId: uuid,
      containmentName,
    });
  }

  addChild(container: ModelNode, containmentName: string, conceptName: string): void {
    this.addChildAtIndex(container, containmentName, -1, conceptName);
  }

  addChildAtIndex(container: ModelNode, containmentName: string, index: number, conceptName: string): void {
    if (index < -1) {
      throw new Error('Index should -1 to indicate to add at the end, or a value >= 0');
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

  setRef(container: ModelNode, referenceName: string, ref: Ref): void {
    if (ref == null) {
      this.sendJSON({
        type: 'setRef',
        modelName: container.modelName(),
        container: container.idString(),
        referenceName,
      });
    } else {
      this.sendJSON({
        type: 'setRef',
        modelName: container.modelName(),
        container: container.idString(),
        referenceName,
        referenceValue: {
          model: ref.data.model.qualifiedName,
          id: ref.data.id.regularId,
        },
      });
    }
  }

  insertNextSibling(sibling: ModelNode): void {
    this.sendJSON({
      type: 'insertNextSibling',
      modelName: sibling.modelName(),
      sibling: sibling.idString(),
    });
  }

  setChild(container: ModelNode, containmentName: string, conceptName: string): void {
    this.sendJSON({
      type: 'setChild',
      modelName: container.modelName(),
      container: container.idString(),
      containmentName,
      conceptToInstantiate: conceptName,
    });
  }

  deleteNode(node: ModelNode): void {
    this.sendJSON({
      type: 'deleteNode',
      modelName: node.modelName(),
      node: node.idString(),
    });
  }

  deleteNodeById(modelName: string, nodeId: string): void {
    this.sendJSON({
      type: 'deleteNode',
      modelName,
      node: nodeId,
    });
  }

  triggerChangeOnPropertyNode(modelNode: ModelNode, propertyName: string, propertyValue: PropertyType): void {
    this.sendJSON({
      type: 'propertyChange',
      nodeId: modelNode.idString(),
      modelName: modelNode.modelName(),
      propertyName,
      propertyValue,
    });
  }

  // Get alternative concepts usable
  askAlternatives(
    modelNode: ModelNode,
    containmentName: string,
    alternativesReceiver: (Alternatives) => void,
    uuid: string = uuidv4(),
  ): void {
    // we generate a UUID and ask the server to answer us using such UUID
    this.callbacks[uuid] = alternativesReceiver;
    this.sendJSON({
      type: 'askAlternatives',
      requestId: uuid,
      modelName: modelNode.modelName(),
      nodeId: modelNode.idString(),
      containmentName,
    });
  }

  // Get alternatives nodes that can be references
  askAlternativesForDirectReference(
    modelNode: ModelNode,
    referenceName: string,
    alternativesReceiver: (alternatives: AlternativesForDirectReference) => void,
    uuid: string = uuidv4(),
  ): void {
    this.callbacks[uuid] = alternativesReceiver;
    this.sendJSON({
      type: 'requestForDirectReferences',
      requestId: uuid,
      modelName: modelNode.modelName(),
      container: modelNode.idString(),
      referenceName,
    });
  }
}

const instances = {};

export function getWsCommunication(modelName: string): WsCommunication {
  return instances[modelName];
}

export function createInstance(url: string, modelName: string, localName: string) {
  const instance = new WsCommunication(url, modelName, localName);
  instances[modelName] = instance;
}
