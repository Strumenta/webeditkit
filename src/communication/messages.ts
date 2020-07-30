/*
 * This file contains all the messages which are exchanged with the MPS Server
 */

import { NodeData, NodeId, NodeInModel, PropertiesValues, PropertyValue } from '../internal';
import { Alternatives } from '../internal';
import { ModelNode } from '../internal';

// Refactoring plan:
// * Revisit NodeId to be a simple string
// * Rename NodeReference as QualifiedNodeID
// * Use QualifiedNodeID in all messages which uses both a model name and an ID
// * Use NodeID where the an identifier of a node is expected

export type UUID = string;

//
// Support structures
//

export interface NodeReference {
  model: string;
  id: NodeId;
}

export function nodeReference(model: string, idString: string): NodeReference {
  return {
    model,
    id: {
      regularId: idString,
    },
  };
}

export function nodeReferenceFromNode(node: ModelNode): NodeReference {
  return nodeReference(node.modelName(), node.idString());
}

export interface IssueDescription {
  message: string;
  severity: string;
  node: NodeId;
}

//
// Interface extended by concrete messages.
//

export interface Message {
  type: string;
}

export interface RequestAnswer extends Message {
  requestId: string;
}

export interface RequestMessage extends Message {
  requestId: string;
}

//
// Messages regarding Nodes addition/removal
//

export interface NodeAdded extends Message {
  parentNodeId: NodeId;
  relationName: string;
  index: number;
  child: NodeData;
}

export interface NodeRemoved extends Message {
  parentNodeId: NodeId;
  relationName: string;
  child: NodeData;
}

export interface DeleteNode extends Message {
  type: 'deleteNode';
  node: NodeReference;
}

export interface InstantiateConcept extends Message {
  type: 'instantiateConcept';
  nodeToReplace: NodeReference;
  conceptToInstantiate: string;
}

export interface CreateRoot extends Message {
  type: 'createRoot';
  modelName: string;
  conceptName: string;
  propertiesValues: PropertiesValues;
}

//
// Messages regarding Properties
//

/**
 * Property change request (property changed by ourselves)
 */
export interface RequestPropertyChange extends RequestMessage {
  type: 'propertyChange';
  node: NodeReference;
  propertyName: string;
  propertyValue: PropertyValue;
}

/**
 * Confirms that property change was processed
 */
export interface AnswerPropertyChange extends RequestAnswer {
  type: 'AnswerPropertyChange';
}

/**
 * Property change notification (property was changed by ourselves or another client)
 */
export interface PropertyChangeNotification extends Message {
  type: 'PropertyChange';
  node: NodeReference;
  propertyName: string;
  propertyValue: PropertyValue;
}

//
// Messages regarding Children
//

export interface AddChild extends RequestMessage {
  type: 'addChild';
  index: number;
  container: NodeReference;
  containmentName: string;
  conceptToInstantiate: string;
}

export interface AddChildAnswer extends RequestAnswer {
  nodeCreated: NodeInModel;
}

export interface SetChild extends RequestMessage {
  type: 'setChild';
  container: NodeReference;
  containmentName: string;
  conceptToInstantiate: string;
}

export interface InsertNextSibling extends Message {
  type: 'insertNextSibling';
  modelName: string;
  sibling: string;
}

export interface DefaultInsertion extends RequestMessage {
  type: 'defaultInsertion';
  modelName: string;
  container: string;
  containmentName: string;
}

//
// Messages regarding References
//

export interface ReferenceChange extends Message {
  node: NodeInModel;
  referenceName: string;
  referenceValue: NodeInModel;
}

export interface RequestForDirectReferences extends RequestMessage {
  type: 'requestForDirectReferences';
  modelName: string;
  container: string;
  referenceName: string;
}

//
// Messages regarding Issues
//

export interface ErrorsForModelReport extends Message {
  model: string;
  issues: IssueDescription[];
}

export interface ErrorsForNodeReport extends Message {
  rootNode: NodeInModel;
  issues: IssueDescription[];
}

export interface AskErrorsForNode extends Message {
  rootNode: NodeInModel;
}

//
// Messages regarding suggestions
//

export interface AskAlternatives extends RequestMessage {
  type: 'askAlternatives';
  modelName: string;
  nodeId: string;
  containmentName: string;
}

export interface AnswerAlternatives extends RequestAnswer {
  type: 'AnswerAlternatives';
  items: Alternatives;
}

export interface AnswerDefaultInsertion extends RequestAnswer {
  type: 'AnswerDefaultInsertion';
  addedNodeID: NodeId;
}

export interface AnswerForDirectReferences extends RequestAnswer {
  type: 'AnswerAlternatives';
  items: Alternatives;
}

//
// IntentionData messages
//

export interface CreateIntentionsBlock extends RequestMessage {
  type: 'CreateIntentionsBlock';
  node: NodeReference;
}

export interface CreateIntentionsBlockAnswer extends RequestAnswer {
  type: 'CreateIntentionsBlockAnswer';
  blockUUID: UUID;
  intentions: IntentionData[];
}

export interface DeleteIntentionsBlock extends Message {
  type: 'DeleteIntentionsBlock';
  blockUUID: UUID;
}

export interface ExecuteIntention extends Message {
  type: 'ExecuteIntention';
  blockUUID: UUID;
  index: number;
}

export interface GetIntentionsBlock extends RequestMessage {
  type: 'GetIntentionsBlock';
  blockUUID: UUID;
}

export interface IntentionData {
  index: number;
  description: string;
}

export interface GetIntentionsBlockAnswer extends RequestAnswer {
  type: 'GetIntentionsBlockAnswer';
  blockUUID: UUID;
  intentions: IntentionData[];
}

//
// Node messages
//

export interface GetNode extends RequestMessage {
  type: 'GetNode';
  node: NodeReference;
}

export interface GetNodeAnswer extends RequestAnswer {
  type: 'GetNodeAnswer';
  nodeData: NodeData;
}

//
// Other messages
//

export interface RegisterForChanges extends Message {
  type: 'registerForChanges';
  modelName: string;
}

//
// Language and concept
//

export interface Link {
  name: string;
  optional: boolean;
  type: string;
}

export interface Containment extends Link {
  multiple: boolean;
}

export type Reference = Link;

export interface Property {
  name: string;
  type: string;
}

export interface Concept {
  qualifiedName: string;
  alias: string;
  isInterface: boolean;
  isAbstract: boolean;
  rootable: boolean;
  superConcept?: string;
  interfaceConcepts: string[];
  declaredContainments: Containment[];
  inheritedContainments: Containment[];
  declaredReferences: Reference[];
  inheritedReferences: Reference[];
  declaredProperties: Property[];
  inheritedProperties: Property[];
}

export interface EnumLiteral {
  name: string;
  label: string;
}

export interface Enum {
  name: string;
  defaultLiteral?: string;
  literals: EnumLiteral[];
}

export interface LanguageInfo {
  qualifiedName: string;
  sourceModuleName: string;
}

export interface LanguageInfoDetailed extends LanguageInfo {
  concepts: Concept[];
  enums: Enum[];
}