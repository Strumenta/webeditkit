import { getDatamodelRoot } from './registry';
import { ModelNode } from './modelNode';
import { Ref } from './ref';

///
/// Nodes
///

export interface NodeId {
  regularId: string;
}

export function nodeIdToString(nodeId: NodeId): string {
  return nodeId.regularId;
}

export interface NodeData {
  abstractConcept: boolean;
  properties: PropertiesValues;
  children: NodeData[];
  concept: string;
  containingLink?: string;
  id: NodeId;
  refs: { [key: string]: ReferenceData };
  rootName?: string;
  modelName?: string; // The qualified model name
  parent?: NodeData;
}

export interface NodeInModel {
  model: string;
  id: NodeId;
}

///
/// References
///

// TODO merge with NodeInModel
export interface ReferenceData {
  model: ModelId;
  id: NodeId;
}

///
/// Models
///

interface ModelId {
  qualifiedName: string;
}

///
/// Properties
///

interface EnumValue {
  myId: string;
  myNameHint: string;
}

export type PropertyValue = string | boolean | number | EnumValue;

export type PropertiesValues = { [key: string]: PropertyValue };

///
/// Node navigation
///

export function findNode(localModelName, nodeId): ModelNode | null {
  return getDatamodelRoot(localModelName).findNodeById(nodeId);
}

///
/// Conversion utilities
///

export function modelNodeToNodeInModel(node: ModelNode | null): NodeInModel | null {
  if (node == null) {
    return null;
  }
  return {
    model: node.modelName(),
    id: {
      regularId: node.idString(),
    },
  };
}

export function refToNodeInModel(ref: Ref | null): NodeInModel | null {
  if (ref == null) {
    return null;
  }
  return {
    model: ref.data.model.qualifiedName,
    id: {
      regularId: ref.data.id.regularId,
    },
  };
}