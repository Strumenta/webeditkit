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

export interface RequestAnswerMessage extends Message {
  requestId: string;
}

export interface RequestMessage extends Message {
  requestId: string;
}

export interface Notification {
  type: string;
}

export interface IntentionData {
  index: number;
  description: string;
}

export interface Result {
  success: boolean;
  explanation: string;
}
