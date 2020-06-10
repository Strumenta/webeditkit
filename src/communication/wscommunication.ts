import {
  modelNodeToNodeInModel,
  NodeId,
  nodeIdToString,
  PropertiesValues,
  PropertyValue,
  refToNodeInModel,
} from '../datamodel/misc';
import { uuidv4 } from '../utils/misc';
import { ModelNode, NodeProcessor, reactToAReferenceChange } from '../datamodel/modelNode';
import { Ref } from '../datamodel';
import { dataToNode, getDatamodelRoot, getNodeFromLocalRepo } from '../datamodel/registry';
import { renderDataModels } from '../index';
import { getIssuesForModel } from './issues';
export { getIssuesForModel };

import {
  AddChild,
  AddChildAnswer,
  AnswerAlternatives,
  AnswerDefaultInsertion,
  AnswerForDirectReferences,
  AnswerPropertyChange,
  AskAlternatives,
  AskErrorsForNode, CreateIntentionsBlock, CreateIntentionsBlockAnswer,
  CreateRoot,
  DefaultInsertion,
  DeleteNode,
  ErrorsForModelReport,
  ErrorsForNodeReport, GetIntentionsBlock, GetIntentionsBlockAnswer,
  InsertNextSibling,
  InstantiateConcept, Intention,
  IssueDescription,
  Message,
  NodeAdded, NodeIDInModel, nodeIDInModelFromNode,
  NodeRemoved,
  PropertyChangeNotification,
  ReferenceChange,
  RegisterForChanges,
  RequestForDirectReferences,
  RequestPropertyChange,
  SetChild, UUID,
} from './messages';
import { registerIssuesForModel, registerIssuesForNode } from './issues';

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

type MessageHandler<M extends Message> = (msg: M) => void;

export class WsCommunication {
  private ws: WebSocket;
  private modelName: string; // This is the qualified model name
  private localName: string; // This is the local model name or target
  private silent: boolean;
  private handlers: { [type: string]: MessageHandler<Message> };
  private readonly callbacks: {};

  private registerHandlersForErrorMessages() {
    this.registerHandler('ErrorsForModelReport', (msg: ErrorsForModelReport) => {
      if (registerIssuesForModel(msg.model, msg.issues)) {
        renderDataModels();
      }
    });
    this.registerHandler('ErrorsForNodeReport', (msg: ErrorsForNodeReport) => {
      if (registerIssuesForNode(msg.rootNode, msg.issues)) {
        renderDataModels();
      }
    });
  }

  private registerHandlersForNodeChanges() {
    this.registerHandler('propertyChange', (msg: PropertyChangeNotification) => {
      const root = getDatamodelRoot(this.localName);
      if (root == null) {
        throw new Error('data model with local name ' + this.localName + ' was not found');
      }
      const node = dataToNode(root.data).findNodeById(nodeIdToString(msg.node.id));
      node.setProperty(msg.propertyName, msg.propertyValue);
      renderDataModels();
    });
    this.registerHandler('ReferenceChange', (msg: ReferenceChange) => {
      const root = getDatamodelRoot(this.localName);
      if (root == null) {
        throw new Error('data model with local name ' + this.localName + ' was not found');
      }
      reactToAReferenceChange(msg, root);
    });
  }

  private registerHandlersForNodesLifecycle() {
    this.registerHandler('nodeAdded', (msg: NodeAdded) => {
      const root = getDatamodelRoot(this.localName);
      if (msg.parentNodeId == null) {
        // this is a new root
      } else {
        if (root == null) {
          throw new Error('data model with local name ' + this.localName + ' was not found');
        }
        const parentNode = dataToNode(root.data).findNodeById(nodeIdToString(msg.parentNodeId));
        if (parentNode == null) {
          throw new Error('Cannot add node because parent was not found. ID was: ' + JSON.stringify(msg.parentNodeId));
        }
        parentNode.addChild(msg.relationName, msg.index, msg.child);
      }
      renderDataModels();
    });
    this.registerHandler('nodeRemoved', (msg: NodeRemoved) => {
      const root = getDatamodelRoot(this.localName);
      if (msg.parentNodeId == null) {
        // this is a root
      } else {
        if (root == null) {
          throw new Error('data model with local name ' + this.localName + ' was not found');
        }
        const parentNode = dataToNode(root.data).findNodeById(nodeIdToString(msg.parentNodeId));
        if (parentNode == null) {
          throw new Error('Cannot remove node because parent was not found');
        }
        parentNode.removeChild(msg.relationName, msg.child);
      }
      renderDataModels();
    });
    this.registerHandler('AddChildAnswer', (msg: AddChildAnswer) => {
      const callback = this.getAndDeleteCallback(msg.requestId);
      if (callback != null) {
        const createdNode: ModelNode = getNodeFromLocalRepo(msg.nodeCreated);
        if (createdNode == null) {
          console.warn(
            'cannot handle AddChildAnswer as we cannot find the created node in the local repo',
            msg.nodeCreated,
          );
        } else {
          callback(createdNode);
        }
      }
    });
  }

  private registerHandlersForCallbacks() {
    this.registerHandler('AnswerAlternatives', (msg: AnswerAlternatives) => {
      this.invokeCallback(msg.requestId, msg.items);
    });
    this.registerHandler('AnswerDefaultInsertion', (msg: AnswerDefaultInsertion) => {
      this.invokeRequiredCallback(msg.requestId, 'default insertion', msg.addedNodeID);
    });
    this.registerHandler('AnswerForDirectReferences', (msg: AnswerForDirectReferences) => {
      this.invokeCallback(msg.requestId, msg.items);
    });
    this.registerHandler('AnswerPropertyChange', (msg: AnswerPropertyChange) => {
      this.invokeCallback(msg.requestId);
    });
  }

  private registerHandlersForIntentions() {
    this.registerHandler('CreateIntentionsBlockAnswer', (msg: CreateIntentionsBlockAnswer) => {
      this.invokeCallback(msg.requestId, msg.blockUUID);
    });
    this.registerHandler('GetIntentionsBlockAnswer', (msg: GetIntentionsBlockAnswer) => {
      this.invokeCallback(msg.requestId, msg.intentions);
    });
  }

  private registerHandler(type: string, handler: MessageHandler<Message>) {
    this.handlers[type.toLowerCase()] = handler;
  }

  constructor(url: string, modelName: string, localName: string, ws?: WebSocket) {
    this.ws = ws || new WebSocket(url);
    this.modelName = modelName;
    this.localName = localName;
    this.callbacks = {};
    this.silent = true;

    const thisWS = this;

    this.handlers = {};
    this.registerHandlersForErrorMessages();
    this.registerHandlersForNodeChanges();
    this.registerHandlersForNodesLifecycle();
    this.registerHandlersForCallbacks();
    this.registerHandlersForIntentions();

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
      const handler = this.handlers[data.type.toLowerCase()];
      if (handler == null) {
        if (!this.silent) {
          console.warn('data', data);
        }
        throw new Error('Unknown message type: ' + data.type);
      } else {
        handler(data);
        return;
      }
    };
  }

  private invokeRequiredCallback(requestId: string, description: string, ...args: any[]) {
    const cb = this.getAndDeleteCallback(requestId);
    if (cb == null) {
      throw new Error(`No callback for request ${requestId} (${description})`);
    }
    cb(...args);
  }

  private invokeCallback(requestId: string, ...args: any[]) {
    const cb = this.getAndDeleteCallback(requestId);
    if (cb != null) {
      cb(...args);
    }
  }

  private getAndDeleteCallback(requestId: string) {
    const cb = this.callbacks[requestId];
    delete this.callbacks[requestId];
    return cb;
  }

  setSilent() {
    this.silent = true;
  }

  setVerbose() {
    this.silent = false;
  }

  createRoot(modelName: string, conceptName: string, propertiesValues: PropertiesValues): void {
    this.sendMessage({
      type: 'createRoot',
      modelName,
      conceptName,
      propertiesValues,
    } as CreateRoot);
  }

  private sendMessage(message: Message) {
    this.ws.send(JSON.stringify(message));
  }

  private registerForChangesInModel(modelName: string): void {
    this.sendMessage({
      type: 'registerForChanges',
      modelName,
    } as RegisterForChanges);
  }

  async getIntentions(modelNode: ModelNode | NodeIDInModel, uuid1: string = uuidv4(), uuid2: string = uuidv4()) : Promise<Intention[]> {
    return new Promise<Intention[]>((resolve, reject) => {
      this.callbacks[uuid1] = (blockUUID: UUID) => {
        this.sendMessage({
          type: 'GetIntentionsBlock',
          requestId: uuid2
        } as GetIntentionsBlock)
      };
      this.callbacks[uuid2] = (intentions: Intention[]) => {
        return resolve(intentions);
      };
      const nodeIDInModel = modelNode instanceof ModelNode ? nodeIDInModelFromNode(modelNode) : modelNode;
      this.sendMessage({
        type: 'CreateIntentionsBlock',
        requestId: uuid1,
        node: nodeIDInModel
      } as CreateIntentionsBlock)
    });
  }

  instantiate(conceptName: string, nodeToReplace: ModelNode): void {
    this.sendMessage({
      type: 'instantiateConcept',
      modelName: nodeToReplace.modelName(),
      conceptToInstantiate: conceptName,
      nodeToReplace: nodeToReplace.idString(),
    } as InstantiateConcept);
  }

  triggerDefaultInsertion(
    container,
    containmentName,
    reactorToInsertion: (addedNodeID: NodeId) => void,
    uuid: string = uuidv4(),
  ): void {
    this.callbacks[uuid] = reactorToInsertion;
    this.sendMessage({
      type: 'defaultInsertion',
      modelName: container.modelName(),
      container: container.idString(),
      requestId: uuid,
      containmentName,
    } as DefaultInsertion);
  }

  addChild(container: ModelNode, containmentName: string, conceptName: string): void {
    this.addChildAtIndex(container, containmentName, -1, conceptName);
  }

  askForErrorsInNode(modelName: string, nodeID: string): void {
    const msg: AskErrorsForNode = {
      rootNode: { id: { regularId: nodeID }, model: modelName },
      type: 'AskErrorsForNode',
    };
    this.sendMessage(msg);
  }

  addChildAtIndex(
    container: ModelNode,
    containmentName: string,
    index: number,
    conceptName: string,
    initializer?: NodeProcessor,
    uuid: string = uuidv4(),
  ): void {
    if (index < -1) {
      throw new Error('Index should -1 to indicate to add at the end, or a value >= 0');
    }
    this.callbacks[uuid] = initializer;
    this.sendMessage({
      type: 'addChild',
      requestId: uuid,
      index,
      modelName: container.modelName(),
      container: container.idString(),
      containmentName,
      conceptToInstantiate: conceptName,
    } as AddChild);
  }

  communicateReferenceChange(container: ModelNode, referenceName: string, ref: Ref): void {
    // TODO communicateReferenceChange should become a Reference Change: we are saying
    // to the server that a reference changed
    this.sendMessage({
      type: 'ReferenceChange',
      node: modelNodeToNodeInModel(container),
      referenceName,
      referenceValue: ref == null? null : refToNodeInModel(ref),
    } as ReferenceChange);
  }

  insertNextSibling(sibling: ModelNode): void {
    this.sendMessage({
      type: 'insertNextSibling',
      modelName: sibling.modelName(),
      sibling: sibling.idString(),
    } as InsertNextSibling);
  }

  setChild(
    container: ModelNode,
    containmentName: string,
    conceptName: string,
    initializer?: NodeProcessor,
    uuid: string = uuidv4(),
  ): void {
    this.callbacks[uuid] = initializer;
    this.sendMessage({
      type: 'setChild',
      requestId: uuid,
      modelName: container.modelName(),
      container: container.idString(),
      containmentName,
      conceptToInstantiate: conceptName,
    } as SetChild);
  }

  deleteNode(node: ModelNode): void {
    this.sendMessage({
      type: 'deleteNode',
      modelName: node.modelName(),
      node: node.idString(),
    } as DeleteNode);
  }

  deleteNodeById(modelName: string, nodeId: string): void {
    this.sendMessage({
      type: 'deleteNode',
      modelName,
      node: nodeId,
    } as DeleteNode);
  }

  triggerChangeOnPropertyNode(
    modelNode: ModelNode,
    propertyName: string,
    propertyValue: PropertyValue,
    callback?: () => void,
    requestId: string = uuidv4(),
  ): void {
    if (callback != null) {
      this.callbacks[requestId] = callback;
    }
    this.sendMessage({
      type: 'propertyChange',
      node: {
        model: modelNode.modelName(),
        id: {
          regularId: modelNode.idString(),
        },
      },
      propertyName,
      propertyValue,
      requestId,
    } as RequestPropertyChange);
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
    this.sendMessage({
      type: 'askAlternatives',
      requestId: uuid,
      modelName: modelNode.modelName(),
      nodeId: modelNode.idString(),
      containmentName,
    } as AskAlternatives);
  }

  // Get alternatives nodes that can be references
  askAlternativesForDirectReference(
    modelNode: ModelNode,
    referenceName: string,
    alternativesReceiver: (alternatives: AlternativesForDirectReference) => void,
    uuid: string = uuidv4(),
  ): void {
    this.callbacks[uuid] = alternativesReceiver;
    this.sendMessage({
      type: 'requestForDirectReferences',
      requestId: uuid,
      modelName: modelNode.modelName(),
      container: modelNode.idString(),
      referenceName,
    } as RequestForDirectReferences);
  }
}

const instances = {};

export function getWsCommunication(modelName: string): WsCommunication {
  return instances[modelName];
}

export function createInstance(url: string, modelName: string, localName: string, ws?: WebSocket): WsCommunication {
  const instance = new WsCommunication(url, modelName, localName, ws);
  instances[modelName] = instance;
  return instance;
}
