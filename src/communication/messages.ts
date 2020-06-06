/*
 * This file contains all the messages which are exchanged with the MPS Server
 */

import { NodeData, NodeId, NodeInModel, PropertiesValues, PropertyValue } from '../datamodel/misc';
import { Alternatives } from './wscommunication';

// Refactoring plan:
// * Revisit NodeId to be a simple string
// * Rename NodeIDInModel as QualifiedNodeID
// * Use QualifiedNodeID in all messages which uses both a model name and an ID
// * Use NodeID where the an identifier of a node is expected

//
// Support structures
//

export interface NodeIDInModel {
  model: string;
  id: NodeId;
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
  modelName: string;
  node: string;
}

export interface InstantiateConcept extends Message {
  type: 'instantiateConcept';
  modelName: string;
  conceptToInstantiate: string;
  nodeToReplace: string;
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
  node: NodeIDInModel;
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
  node: NodeIDInModel;
  propertyName: string;
  propertyValue: PropertyValue;
}

//
// Messages regarding Children
//

export interface AddChild extends RequestMessage {
  type: 'addChild';
  index: number;
  modelName: string;
  container: string;
  containmentName: string;
  conceptToInstantiate: string;
}

export interface AddChildAnswer extends RequestAnswer {
  nodeCreated: NodeInModel;
}

export interface SetChild extends RequestMessage {
  type: 'setChild';
  modelName: string;
  container: string;
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
// Other messages
//

export interface RegisterForChanges extends Message {
  type: 'registerForChanges';
  modelName: string;
}
