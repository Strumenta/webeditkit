import {
  GetInstancesOfConceptAnswer,
  GetRoots, GetRootsAnswer,
  limitedDataToNode,
  LimitedModelNode, LimitedNodeData,
  modelNodeToNodeInModel,
  NodeData,
  NodeId,
  nodeIdToString, OperationResult,
  PropertiesValues,
  PropertyValue,
  refToNodeInModel,
} from '../internal';
import { uuidv4 } from '../internal';
import { ModelNode, NodeProcessor, reactToAReferenceChange } from '../internal';
import { Ref } from '../internal';
import { dataToNode, getDatamodelRoot, getNodeFromLocalRepo } from '../internal';
import { renderDataModels } from '../internal';
import { getIssuesForModel } from '../internal';

export { getIssuesForModel };

import {
  AddChild,
  AddChildAnswer,
  AnswerAlternatives,
  AnswerDefaultInsertion,
  AnswerForDirectReferences,
  AnswerPropertyChange,
  AskAlternatives,
  AskErrorsForNode,
  CreateIntentionsBlock,
  CreateIntentionsBlockAnswer,
  CreateRoot,
  DefaultInsertion,
  DeleteNode,
  ErrorsForModelReport,
  ErrorsForNodeReport,
  ExecuteIntention,
  GetIntentionsBlock,
  GetIntentionsBlockAnswer,
  GetNode,
  GetNodeAnswer,
  InsertNextSibling,
  InstantiateConcept,
  IntentionData,
  IssueDescription,
  Message,
  NodeAdded,
  NodeReference,
  nodeReferenceFromNode,
  NodeRemoved,
  PropertyChange,
  ReferenceChange,
  RegisterForChanges,
  RequestForDirectReferences,
  RequestForPropertyChange,
  SetChild,
  UUID,
} from '../internal';
import { registerIssuesForModel, registerIssuesForNode } from '../internal';
import { GetInstancesOfConcept } from '../internal';
import exp from 'constants';

export interface Alternative {
  conceptName: string;
  alias: string;
  node?: NodeData;
}

export interface AlternativeForDirectReference {
  label: string;
  modelName: string;
  nodeId: NodeId;
}

export type Alternatives = Alternative[];
export type AlternativesForDirectReference = AlternativeForDirectReference[];

type MessageHandler<M extends Message> = (msg: M) => void;

export class Intention implements IntentionData {
  constructor(public ws: WsCommunication, public blockUUID: UUID, public index: number, public description: string) {}

  execute(): void {
    this.ws.executeIntention(this.blockUUID, this.index);
  }
}

type IntentionsCallback = (blockUUID: UUID, intentionsData: IntentionData[]) => void;
type NodeAddedCallback = (addedNodeID: NodeId) => void;
type DirectAlternativesReceiver = (alternatives: AlternativesForDirectReference) => void;
type AlternativesReceiver = (alternatives: Alternatives) => void;
type NodeDataReceiver = (data: NodeData) => void;
type LimitedNodesDataReceiver = (data: LimitedNodeData[]) => void;
type LimitedModelNodesReceiver = (data: LimitedModelNode[]) => void;
type Callback =
  | NodeProcessor
  | IntentionsCallback
  | NodeAddedCallback
  | AlternativesReceiver
  | DirectAlternativesReceiver
  | NodeDataReceiver
  | LimitedNodesDataReceiver;

export class RootsObserver {
  nodeAdded: (modelName: string, node: ModelNode) => void;
  nodeRemoved: (modelName: string, nodeId: NodeId) => void;
}

abstract class AbstractWsCommunication {
  private ws: WebSocket;
  private silent: boolean;
  private readonly handlers: { [type: string]: MessageHandler<Message> };
  private readonly callbacks: { [requestId: string]: Callback };

  constructor(url: string, ws?: WebSocket) {
    this.ws = ws || new WebSocket(url);
    this.callbacks = {};
    this.silent = true;

    this.handlers = {};
    this.registerHandlers();

    this.ws.onmessage = (event) => {
      if (!this.silent) {
        console.info('onmessage', event);
      }
      const data = JSON.parse(event.data) as Message;
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

  dispose() {
    this.ws.close();
  }

  protected sendMessage(message: Message, nAttempts = 10) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else if (this.ws.readyState === WebSocket.CONNECTING) {
      if (nAttempts > 0) {
        setTimeout(() => {
          this.sendMessage(message, nAttempts - 1);
        }, 25);
      } else {
        throw new Error(
          `Cannot send message because it is not connected. Cannot send: ${JSON.stringify(message)}. Status: ${
            this.ws.readyState
          }`,
        );
      }
    } else {
      console.log('message not sent because not connected or connecting', message);
    }
  }

  protected registerHandler(type: string, handler: MessageHandler<Message>) {
    this.handlers[type.toLowerCase()] = handler;
  }

  protected abstract registerHandlers() : void;

  protected invokeCallback(requestId: string, ...args: any[]) {
    const cb = this.getAndDeleteCallback(requestId);
    if (cb != null) {
      // @ts-ignore
      cb(...args);
    }
  }

  protected getAndDeleteCallback(requestId: string) {
    const cb = this.callbacks[requestId];
    delete this.callbacks[requestId];
    return cb;
  }

  setSilent(): void {
    this.silent = true;
  }

  setVerbose(): void {
    this.silent = false;
  }
}

export class WsGlobalCommunication {
  private ws: WebSocket;
  private silent: boolean;
  private readonly handlers: { [type: string]: MessageHandler<Message> };
  private readonly callbacks: { [requestId: string]: Callback };

  constructor(url: string, ws?: WebSocket) {
    this.ws = ws || new WebSocket(url);
    this.callbacks = {};
    this.silent = true;

    this.handlers = {};
    this.registerHandlers();

    this.ws.onmessage = (event) => {
      if (!this.silent) {
        console.info('onmessage', event);
      }
      const data = JSON.parse(event.data) as Message;
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

  dispose() {
    this.ws.close();
  }

  getInstancesOfConcept(modelName: string, conceptName: string, receiver: LimitedModelNodesReceiver, uuid: string = uuidv4()): void {
    this.callbacks[uuid] = (data: LimitedNodeData[]) => {
      receiver(data.map((el)=>new LimitedModelNode(el)));
    };
    this.sendMessage({
      type: 'getInstancesOfConcept',
      requestId: uuid,
      modelName,
      conceptName
    } as GetInstancesOfConcept);
  }

  getRoots(modelName: string, receiver: LimitedModelNodesReceiver, uuid: string = uuidv4()): void {
    this.callbacks[uuid] = (data: LimitedNodeData[]) => {
      receiver(data.map((el)=>new LimitedModelNode(el)));
    };
    this.sendMessage({
      type: 'getRoots',
      requestId: uuid,
      modelName
    } as GetRoots);
  }

  private sendMessage(message: Message, nAttempts = 10) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else if (this.ws.readyState === WebSocket.CONNECTING) {
      if (nAttempts > 0) {
        setTimeout(() => {
          this.sendMessage(message, nAttempts - 1);
        }, 25);
      } else {
        throw new Error(
          `Cannot send message because it is not connected. Cannot send: ${JSON.stringify(message)}. Status: ${
            this.ws.readyState
          }`,
        );
      }
    } else {
      console.log('message not sent because not connected or connecting', message);
    }
  }

  private registerHandler(type: string, handler: MessageHandler<Message>) {
    this.handlers[type.toLowerCase()] = handler;
  }

  private registerHandlers() {
    this.registerHandler('GetInstancesOfConceptAnswer', (msg: GetInstancesOfConceptAnswer) => {
      this.invokeCallback(msg.requestId, msg.nodes);
    });
    this.registerHandler('GetRootsAnswer', (msg: GetRootsAnswer) => {
      this.invokeCallback(msg.requestId, msg.nodes);
    });
  }

  private invokeCallback(requestId: string, ...args: any[]) {
    const cb = this.getAndDeleteCallback(requestId);
    if (cb != null) {
      // @ts-ignore
      cb(...args);
    }
  }

  private getAndDeleteCallback(requestId: string) {
    const cb = this.callbacks[requestId];
    delete this.callbacks[requestId];
    return cb;
  }

  setSilent(): void {
    this.silent = true;
  }

  setVerbose(): void {
    this.silent = false;
  }
}

/**
 * It is used to communicate w.r.t. a specific model.
 */
export class WsCommunication {
  private ws: WebSocket;
  private readonly modelName: string; // This is the qualified model name
  private readonly localName: string; // This is the local model name or target
  private silent: boolean;
  private readonly handlers: { [type: string]: MessageHandler<Message> };
  private readonly callbacks: { [requestId: string]: Callback };
  private rootsObservers: RootsObserver[] = [];

  registerRootsObserver(observer: RootsObserver): void {
    this.rootsObservers.push(observer);
  }

  unregisterRootsObserver(observer: RootsObserver): boolean {
    const index = this.rootsObservers.indexOf(observer, 0);
    if (index !== -1) {
      this.rootsObservers.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }

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
    this.registerHandler('propertyChange', (msg: PropertyChange) => {
      const root = getDatamodelRoot(this.localName);
      if (root == null) {
        throw new Error('data model with local name ' + this.localName + ' was not found');
      }
      const node = dataToNode(root.data).findNodeById(nodeIdToString(msg.node.id));
      if (node != null) {
        if (msg.propertyName === 'name') {
          node.data.name = msg.propertyValue as string;
        }
        node.setProperty(msg.propertyName, msg.propertyValue);
        renderDataModels();
      }
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
        this.rootsObservers.forEach((o: RootsObserver) => o.nodeAdded(this.modelName, dataToNode(msg.child)));
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
        this.rootsObservers.forEach((o: RootsObserver) => o.nodeRemoved(this.modelName, msg.child.id));
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
      const callback = this.getAndDeleteCallback(msg.requestId) as (node: ModelNode) => void;
      if (callback != null) {
        const createdNode: ModelNode | undefined = getNodeFromLocalRepo(msg.nodeCreated);
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
      this.invokeCallback(msg.requestId, msg.blockUUID, msg.intentions);
    });
    this.registerHandler('GetIntentionsBlockAnswer', (msg: GetIntentionsBlockAnswer) => {
      this.invokeCallback(msg.requestId, msg.blockUUID, msg.intentions);
    });
  }

  private registerHandlersForNodes() {
    this.registerHandler('GetNodeAnswer', (msg: GetNodeAnswer) => {
      this.invokeCallback(msg.requestId, msg.nodeData);
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
    this.registerHandlersForNodes();

    this.ws.onopen = () => {
      thisWS.registerForChangesInModel(modelName);
    };

    this.ws.onmessage = (event) => {
      if (!this.silent) {
        console.info('onmessage', event);
      }
      const data = JSON.parse(event.data) as Message;
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
    // @ts-ignore
    cb(...args);
  }

  private invokeCallback(requestId: string, ...args: any[]) {
    const cb = this.getAndDeleteCallback(requestId);
    if (cb != null) {
      // @ts-ignore
      cb(...args);
    }
  }

  private getAndDeleteCallback(requestId: string) {
    const cb = this.callbacks[requestId];
    delete this.callbacks[requestId];
    return cb;
  }

  setSilent(): void {
    this.silent = true;
  }

  setVerbose(): void {
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

  private sendMessage(message: Message, nAttempts = 10) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else if (this.ws.readyState === WebSocket.CONNECTING) {
      if (nAttempts > 0) {
        setTimeout(() => {
          this.sendMessage(message, nAttempts - 1);
        }, 25);
      } else {
        throw new Error(
          `Cannot send message because it is not connected. Cannot send: ${JSON.stringify(message)}. Status: ${
            this.ws.readyState
          }`,
        );
      }
    } else {
      console.log('message not sent because not connected or connecting', message);
    }
  }

  private registerForChangesInModel(modelName: string): void {
    this.sendMessage({
      type: 'registerForChanges',
      modelName,
    } as RegisterForChanges);
  }

  executeIntention(blockUUID: UUID, index: number): void {
    this.sendMessage({
      type: 'executeIntention',
      blockUUID,
      index,
    } as ExecuteIntention);
  }

  async getIntentions(modelNode: ModelNode | NodeReference, uuid1: string = uuidv4()): Promise<Intention[]> {
    return new Promise<Intention[]>((resolve, reject) => {
      this.callbacks[uuid1] = (blockUUID: UUID, intentionsData: IntentionData[]) => {
        const intentions: Intention[] = intentionsData.map<Intention>((data: IntentionData) => {
          return new Intention(this, blockUUID, data.index, data.description);
        });
        return resolve(intentions);
      };
      const nodeIDInModel = modelNode instanceof ModelNode ? nodeReferenceFromNode(modelNode) : modelNode;
      this.sendMessage({
        type: 'createIntentionsBlock',
        requestId: uuid1,
        node: nodeIDInModel,
      } as CreateIntentionsBlock);
    });
  }

  instantiate(conceptName: string, nodeToReplace: ModelNode): void {
    this.sendMessage({
      type: 'instantiateConcept',
      nodeToReplace: modelNodeToNodeInModel(nodeToReplace),
      conceptToInstantiate: conceptName,
    } as InstantiateConcept);
  }

  triggerDefaultInsertion(
    container: ModelNode,
    containmentName: string,
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

  addChild(container: ModelNode, containmentName: string, conceptName: string, node?: NodeData): void {
    this.addChildAtIndex(container, containmentName, -1, conceptName, node);
  }

  askForErrorsInNode(modelName: string, nodeID: string): void {
    const msg: AskErrorsForNode = {
      rootNode: { id: { regularId: nodeID }, model: modelName },
      type: 'askErrorsForNode',
    };
    this.sendMessage(msg);
  }

  addChildAtIndex(
    container: ModelNode,
    containmentName: string,
    index: number,
    conceptName: string,
    node?: NodeData, // TODO Alessio should this be a ModelNode instead? How?
    initializer?: NodeProcessor,
    uuid: string = uuidv4(),
  ): void {
    if (index < -1) {
      throw new Error('Index should -1 to indicate to add at the end, or a value >= 0');
    }
    if (initializer != null) {
      this.callbacks[uuid] = initializer;
    }
    this.sendMessage({
      type: 'addChild',
      requestId: uuid,
      index,
      container: modelNodeToNodeInModel(container),
      containmentName,
      conceptToInstantiate: conceptName,
      smartRefNodeId: node?.id,
    } as AddChild);
  }

  communicateReferenceChange(container: ModelNode, referenceName: string, ref: Ref | undefined): void {
    // TODO communicateReferenceChange should become a Reference Change: we are saying
    // to the server that a reference changed
    this.sendMessage({
      type: 'referenceChange',
      node: modelNodeToNodeInModel(container),
      referenceName,
      referenceValue: ref == null ? null : refToNodeInModel(ref),
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
    node?: NodeData,
    initializer?: NodeProcessor,
    uuid: string = uuidv4(),
  ): void {
    if (initializer != null) {
      this.callbacks[uuid] = initializer;
    }
    this.sendMessage({
      type: 'setChild',
      requestId: uuid,
      container: modelNodeToNodeInModel(container),
      containmentName,
      conceptToInstantiate: conceptName,
      smartRefNodeId: node?.id,
    } as SetChild);
  }

  deleteNode(node: ModelNode): void {
    this.sendMessage({
      type: 'deleteNode',
      node: modelNodeToNodeInModel(node),
    } as DeleteNode);
  }

  deleteNodeById(modelName: string, nodeId: string): void {
    this.sendMessage({
      type: 'deleteNode',
      node: {
        model: modelName,
        id: {
          regularId: nodeId,
        },
      },
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
      type: 'requestForPropertyChange',
      node: {
        model: modelNode.modelName(),
        id: {
          regularId: modelNode.idString(),
        },
      },
      propertyName,
      propertyValue,
      requestId,
    } as RequestForPropertyChange);
  }

  // Get alternative concepts usable
  askAlternatives(
    modelNode: ModelNode,
    containmentName: string,
    alternativesReceiver: (alternatives: Alternatives) => void,
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

  async getNodeData(node: NodeReference, uuid: string = uuidv4()): Promise<NodeData> {
    const promise = new Promise<NodeData>((resolve, reject) => {
      this.callbacks[uuid] = (data: NodeData) => {
        resolve(data);
      };
      this.sendMessage({
        type: 'getNode',
        requestId: uuid,
        node,
      } as GetNode);
    });
    return promise;
  }

  dispose() {
    this.ws.close();
  }
}

const instances: { [modelName: string]: WsCommunication } = {};

export function getWsCommunication(modelName: string): WsCommunication {
  return instances[modelName];
}

export function createInstance(url: string, modelName: string, localName: string, ws?: WebSocket): WsCommunication {
  const instance = new WsCommunication(url, modelName, localName, ws);
  instances[modelName] = instance;
  return instance;
}
