import {
  NodeData,
  NodeId,
  nodeIdToString,
  NodeInModel,
  PropertiesValues,
  PropertyValue,
} from '../datamodel/misc';
import { uuidv4 } from '../utils/misc';
import {ModelNode, reactToAReferenceChange} from '../datamodel/modelNode';
import { Ref } from '../datamodel/ref';
import { dataToNode, getDatamodelRoot } from '../datamodel/registry';
import {renderDataModels} from "../index";
var deepEqual = require('deep-equal')

import {
  AskErrorsForNode,
  ErrorsForModelReport, ErrorsForNodeReport,
  IssueDescription,
  NodeAdded,
  NodeRemoved,
  PropertyChange,
  ReferenceChange
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
  private map: {[key: string]: IssueDescription[]} = {};
  constructor(issues: IssueDescription[]) {
    for (const i of issues) {
      if (this.map[i.node.regularId] == null) {
        this.map[i.node.regularId] = [];
      }
      this.map[i.node.regularId].push(i);
    }
  }
  getIssuesForNode(nodeId: string) : IssueDescription[] {
    return this.map[nodeId] || [];
  }
}

const issuesMap : {[key:string]:IssuesMap}= {};

function registerIssuesForModel(model: string, issues: IssueDescription[]) : boolean {
  const newIm = new IssuesMap(issues);
  if (deepEqual(newIm, issuesMap[model])) {
    console.log("registerIssuesForModel, false");
    return false;
  }
  console.log("registerIssuesForModel, true", issuesMap[model], newIm);
  issuesMap[model] = newIm;
  return true;
}

function registerIssuesForNode(node: NodeInModel, issues: IssueDescription[]) : boolean {
  // This is not correct because we are overriding the issues for the whole model with the issues for a certain root
  const newIm = new IssuesMap(issues);
  if (deepEqual(newIm, issuesMap[node.model])) {
    console.log("registerIssuesForNode, false");
    return false;
  }
  console.log("registerIssuesForNode, true", issuesMap[node.model], newIm);
  issuesMap[node.model] = newIm;
  return true;
}

export function getIssuesForModel(model: string) : IssuesMap {
  return issuesMap[model] || new IssuesMap([]);
}

export function getIssuesForNode(node: NodeInModel) : IssueDescription[] {
  return getIssuesForModel(node.model).getIssuesForNode(node.id.regularId);
}

export function modelNodeToNodeInModel(node: ModelNode | null) : NodeInModel | null {
  if (node == null) {
    return null
  }
  return {
    model: node.modelName(),
    id: {
      regularId: node.idString()
    }
  }
}

export function refToNodeInModel(ref: Ref | null) : NodeInModel | null {
  if (ref == null) {
    return null
  }
  return {
    model: ref.data.model.qualifiedName,
    id: {
      regularId: ref.data.id.regularId
    }
  }
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
        const msg = data as PropertyChange;
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

  askForErrorsInNode(modelName: string, nodeID: string): void {
    const msg : AskErrorsForNode = {rootNode: {id: { regularId: nodeID}, model: modelName}, type: "AskErrorsForNode"};
    this.sendJSON(msg)
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

  communicateReferenceChange(container: ModelNode, referenceName: string, ref: Ref): void {
    // TODO communicateReferenceChange should become a Reference Change: we are saying
    // to the server that a reference changed
    if (ref == null) {
      this.sendJSON({
        type: 'ReferenceChange',
        node: modelNodeToNodeInModel(container),
        referenceName,
        referenceValue: null
      } as ReferenceChange);
    } else {
      this.sendJSON({
        type: 'ReferenceChange',
        node: modelNodeToNodeInModel(container),
        referenceName,
        referenceValue: refToNodeInModel(ref),
      } as ReferenceChange);
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

  triggerChangeOnPropertyNode(modelNode: ModelNode, propertyName: string, propertyValue: PropertyValue): void {
    this.sendJSON({
      type: 'propertyChange',
      node: {
        model: modelNode.modelName(),
        id: {
          regularId: modelNode.idString()
        }
      },
      propertyName,
      propertyValue,
    } as PropertyChange);
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

export function createInstance(url: string, modelName: string, localName: string) : WsCommunication{
  const instance = new WsCommunication(url, modelName, localName);
  instances[modelName] = instance;
  return instance;
}
