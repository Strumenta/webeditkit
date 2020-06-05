import {
  modelNodeToNodeInModel,
  NodeId,
  nodeIdToString,
  NodeInModel,
  PropertiesValues,
  PropertyValue, refToNodeInModel,
} from '../datamodel/misc';
import { log, uuidv4 } from '../utils/misc';
import { ModelNode, NodeProcessor, reactToAReferenceChange } from '../datamodel/modelNode';
import { Ref } from '../datamodel';
import { dataToNode, getDatamodelRoot, getNodeFromLocalRepo } from '../datamodel/registry';
import { editorController, renderDataModels } from '../index';
import deepEqual = require('deep-equal');

import {
  AddChild,
  AddChildAnswer, AskAlternatives,
  AskErrorsForNode, CreateRoot, DefaultInsertion, DeleteNode,
  ErrorsForModelReport,
  ErrorsForNodeReport, InsertNextSibling, InstantiateConcept, IssueDescription, Message,
  NodeAdded,
  NodeRemoved,
  PropertyChangeNotification,
  ReferenceChange, RegisterForChanges, RequestForDirectReferences,
  RequestPropertyChange, SetChild,
} from './messages';

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

export class IssuesMap {
  private map: { [key: string]: IssueDescription[] } = {};
  constructor(issues: IssueDescription[]) {
    for (const i of issues) {
      if (this.map[i.node.regularId] == null) {
        this.map[i.node.regularId] = [];
      }
      this.map[i.node.regularId].push(i);
    }
  }
  getIssuesForNode(nodeId: string): IssueDescription[] {
    return this.map[nodeId] || [];
  }
}

const issuesMap: { [key: string]: IssuesMap } = {};

function registerIssuesForModel(model: string, issues: IssueDescription[]): boolean {
  const newIm = new IssuesMap(issues);
  if (deepEqual(newIm, issuesMap[model])) {
    log('registerIssuesForModel, false');
    return false;
  }
  log('registerIssuesForModel, true', issuesMap[model], newIm);
  issuesMap[model] = newIm;
  return true;
}

function registerIssuesForNode(node: NodeInModel, issues: IssueDescription[]): boolean {
  // This is not correct because we are overriding the issues for the whole model with the issues for a certain root
  const newIm = new IssuesMap(issues);
  if (deepEqual(newIm, issuesMap[node.model])) {
    log('registerIssuesForNode, false');
    return false;
  }
  log('registerIssuesForNode, true', issuesMap[node.model], newIm);
  issuesMap[node.model] = newIm;
  editorController().notifyErrorsForNode(node, issues);
  return true;
}

export function getIssuesForModel(model: string): IssuesMap {
  return issuesMap[model] || new IssuesMap([]);
}

export function getIssuesForNode(node: NodeInModel): IssueDescription[] {
  return getIssuesForModel(node.model).getIssuesForNode(node.id.regularId);
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
      if (data.type === 'ErrorsForModelReport') {
        const msg = data as ErrorsForModelReport;
        if (registerIssuesForModel(msg.model, msg.issues)) {
          renderDataModels();
        }
      } else if (data.type.toLowerCase() === 'ErrorsForNodeReport'.toLowerCase()) {
        const msg = data as ErrorsForNodeReport;
        if (registerIssuesForNode(msg.rootNode, msg.issues)) {
          renderDataModels();
        }
      } else if (data.type.toLowerCase() === 'propertyChange'.toLowerCase()) {
        const msg = data as PropertyChangeNotification;
        const root = getDatamodelRoot(localName);
        if (root == null) {
          throw new Error('data model with local name ' + localName + ' was not found');
        }
        const node = dataToNode(root.data).findNodeById(nodeIdToString(msg.node.id));
        node.setProperty(msg.propertyName, msg.propertyValue);
        renderDataModels();
      } else if (data.type === 'ReferenceChange') {
        const msg = data as ReferenceChange;
        const root = getDatamodelRoot(localName);
        if (root == null) {
          throw new Error('data model with local name ' + localName + ' was not found');
        }
        reactToAReferenceChange(msg, root);
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
            throw new Error(
              'Cannot add node because parent was not found. ID was: ' + JSON.stringify(msg.parentNodeId),
            );
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
        this.invokeCallback(data.requestId, data.items);
      } else if (data.type.toLowerCase() === 'AddChildAnswer'.toLowerCase()) {
        const msg = data as AddChildAnswer;
        const callback = this.getAndDeleteCallback(data.requestId);
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
      } else if (data.type === 'AnswerDefaultInsertion') {
        this.invokeRequiredCallback(data.requestId, 'default insertion', data.addedNodeID);
      } else if (data.type === 'AnswerForDirectReferences') {
        this.invokeCallback(data.requestId, data.items);
      } else if (data.type === 'AnswerPropertyChange') {
        this.invokeCallback(data.requestId);
      } else {
        if (!this.silent) {
          console.warn('data', data);
        }
        throw new Error('Unknown message type: ' + data.type);
      }
    };
  }

  invokeRequiredCallback(requestId: string, description: string, ...args: any[]) {
    const cb = this.getAndDeleteCallback(requestId);
    if (cb == null) {
      throw new Error(`No callback for request ${requestId} (${description})`);
    }
    cb(...args);
  }

  invokeCallback(requestId: string, ...args: any[]) {
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
    if (ref == null) {
      this.sendMessage({
        type: 'ReferenceChange',
        node: modelNodeToNodeInModel(container),
        referenceName,
        referenceValue: null,
      } as ReferenceChange);
    } else {
      this.sendMessage({
        type: 'ReferenceChange',
        node: modelNodeToNodeInModel(container),
        referenceName,
        referenceValue: refToNodeInModel(ref),
      } as ReferenceChange);
    }
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

export function createInstance(url: string, modelName: string, localName: string): WsCommunication {
  const instance = new WsCommunication(url, modelName, localName);
  instances[modelName] = instance;
  return instance;
}
