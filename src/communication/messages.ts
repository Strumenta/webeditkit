/*
 * This file contains all the messages which are exchanged with the MPS Server
 */

import { NodeData, NodeId, NodeInModel, PropertyValue } from '../datamodel/misc';

export interface Message {
  type: string;
}

export interface RequestAnswer extends Message {
  requestId: string;
}

export interface RequestMessage extends Message {
  requestId: string;
}

export interface NodeIDInModel {
  model: string;
  id: NodeId;
}

export interface AddChild extends RequestMessage {
  type: 'addChild';
  index: number;
  modelName: string;
  container: string;
  containmentName: string;
  conceptToInstantiate: string;
}

/**
 * Property change request (property changed by ourselves)
 */
export interface RequestPropertyChange extends Message {
  type: 'propertyChange';
  requestId: string;
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

export interface ReferenceChange extends Message {
  node: NodeInModel;
  referenceName: string;
  referenceValue: NodeInModel;
}

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

export interface IssueDescription {
  message: string;
  severity: string;
  node: NodeId;
}

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

export interface AddChildAnswer extends RequestAnswer {
  nodeCreated: NodeInModel;
}
