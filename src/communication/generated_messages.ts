import {
  Message,
  RequestMessage,
  RequestAnswerMessage,
  Notification,
  NodeReference,
  IntentionData,
  Result,
} from './base_messages';
import { NodeId, NodeData, PropertiesValues, PropertyValue } from '../internal';
import { LimitedNodeData } from '../internal';

export interface CreateRoot extends Message {
  type: 'createRoot';
  modelName: string;
  conceptName: string;
  propertiesValues: PropertiesValues;
}

export interface PropertyChange extends Notification {
  type: 'propertyChange';
  node: NodeReference;
  propertyName: string;
  propertyValue: PropertyValue;
}

export interface ReferenceChange extends Message {
  type: 'referenceChange';
  node: NodeReference;
  referenceName: string;
  referenceValue: NodeReference;
}

export interface AddChild extends RequestMessage {
  type: 'addChild';
  container: NodeReference;
  containmentName: string;
  conceptToInstantiate: string;
  index: number;
  smartRefNodeId?: NodeId;
}

export interface SetChild extends Message {
  type: 'setChild';
  container: NodeReference;
  containmentName: string;
  conceptToInstantiate: string;
  smartRefNodeId?: NodeId;
}

export interface DeleteNode extends Message {
  type: 'deleteNode';
  node: NodeReference;
}

export interface AskAlternatives extends RequestMessage {
  type: 'askAlternatives';
  modelName: string;
  nodeId: string;
  containmentName: string;
}

export interface DefaultInsertion extends RequestMessage {
  type: 'defaultInsertion';
  modelName: string;
  container: string;
  containmentName: string;
  conceptName?: string;
}

export interface AnswerDefaultInsertion extends RequestAnswerMessage {
  type: 'answerDefaultInsertion';
  addedNodeID: NodeId;
}

export interface InsertNextSibling extends Message {
  type: 'insertNextSibling';
  modelName: string;
  sibling: string;
}

export interface AnswerAlternatives extends RequestAnswerMessage {
  type: 'answerAlternatives';
  items: AnswerAlternativesItem[];
}

export interface AnswerAlternativesItem {
  conceptName: string;
  alias: string;
}

export interface SmartReferenceAlternative {
  node: NodeData;
}

export interface RequestForDirectReferences extends RequestMessage {
  type: 'requestForDirectReferences';
  modelName: string;
  container: string;
  referenceName: string;
}

export interface AnswerForDirectReferences extends RequestAnswerMessage {
  type: 'answerForDirectReferences';
  items: DirAlternative[];
}

export interface DirAlternative {
  label: string;
  modelName: string;
  nodeId: NodeId;
}

export interface RequestForWrappingReferences extends RequestMessage {
  type: 'requestForWrappingReferences';
  modelName: string;
  container: string;
  containmentName: string;
}

export interface AnswerForWrappingReferences extends RequestAnswerMessage {
  type: 'answerForWrappingReferences';
  items: WraAlternative[];
}

export interface WraAlternative {
  label: string;
  modelName: string;
  nodeId: NodeId;
}

export interface ErrorsForModelReport extends Message {
  type: 'errorsForModelReport';
  model: string;
  issues: IssueDescription[];
}

export interface IssueDescription {
  message: string;
  severity: string;
  node: NodeId;
}

export interface ErrorsForNodeReport extends Message {
  type: 'errorsForNodeReport';
  rootNode: NodeReference;
  issues: IssueDescription[];
}

export interface IssueDescription {
  message: string;
  severity: string;
  node: NodeId;
}

export interface AskErrorsForNode extends Message {
  type: 'askErrorsForNode';
  rootNode: NodeReference;
}

export interface AddChildAnswer extends RequestAnswerMessage {
  type: 'addChildAnswer';
  nodeCreated: NodeReference;
}

export interface AnswerPropertyChange extends RequestAnswerMessage {
  type: 'answerPropertyChange';
}

export interface RequestForPropertyChange extends RequestMessage {
  type: 'requestForPropertyChange';
  node: NodeReference;
  propertyName: string;
  propertyValue: PropertyValue;
}

export interface NodeAdded extends Notification {
  type: 'nodeAdded';
  parentNodeId: NodeId;
  child: NodeData;
  index: number;
  relationName: string;
}

export interface NodeRemoved extends Notification {
  type: 'nodeRemoved';
  parentNodeId: NodeId;
  child: NodeData;
  index: number;
  relationName: string;
}

export interface CreateIntentionsBlock extends RequestMessage {
  type: 'createIntentionsBlock';
  node: NodeReference;
}

export interface CreateIntentionsBlockAnswer extends RequestAnswerMessage {
  type: 'createIntentionsBlockAnswer';
  blockUUID: PropertyValue;
  intentions: IntentionData[];
}

export interface DeleteIntentionsBlock extends Message {
  type: 'deleteIntentionsBlock';
  blockUUID: PropertyValue;
}

export interface ExecuteIntention extends Message {
  type: 'executeIntention';
  blockUUID: PropertyValue;
  index: number;
}

export interface GetIntentionsBlock extends RequestMessage {
  type: 'getIntentionsBlock';
  blockUUID: PropertyValue;
}

export interface GetIntentionsBlockAnswer extends RequestAnswerMessage {
  type: 'getIntentionsBlockAnswer';
  blockUUID: PropertyValue;
  intentions: IntentionData[];
  result: Result;
}

export interface GetNode extends RequestMessage {
  type: 'getNode';
  node: NodeReference;
}

export interface GetNodeAnswer extends RequestAnswerMessage {
  type: 'getNodeAnswer';
  nodeData: NodeData;
}

export interface RegisterForChanges extends Message {
  type: 'registerForChanges';
  modelName: string;
}

export interface InstantiateConcept extends Message {
  type: 'instantiateConcept';
  nodeToReplace: NodeReference;
  conceptToInstantiate: string;
}

export interface GetInstancesOfConcept extends RequestMessage {
  type: 'getInstancesOfConcept';
  modelName: string;
  conceptName: string;
}

export interface GetRoots extends RequestMessage {
  type: 'getRoots';
  modelName: string;
}

export interface GetInstancesOfConceptAnswer extends RequestAnswerMessage {
  type: 'getInstancesOfConceptAnswer';
  modelName: string;
  conceptName: string;
  nodes: LimitedNodeData[];
}

export interface GetRootsAnswer extends RequestAnswerMessage {
  type: 'getRootsAnswer';
  modelName: string;
  nodes: LimitedNodeData[];
}
