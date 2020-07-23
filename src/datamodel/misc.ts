import { getDatamodelRoot } from '../internal';
import { ModelNode } from '../internal';
import { Ref } from '../internal';

///
/// Nodes
///

// TODO refactor to become a simple string
export interface NodeId {
  regularId: string;
}

export function nodeIdToString(nodeId: NodeId): string {
  return nodeId.regularId;
}

export interface LimitedNodeData {
  abstractConcept: boolean;
  concept: string;
  id: NodeId;
  name: string;
}

export interface NodeData extends LimitedNodeData {
  properties: PropertiesValues;
  children: NodeData[];
  containingLink?: string | undefined;
  refs: { [key: string]: ReferenceData };
  rootName?: string | undefined;
  modelName: string; // The qualified model name
  parent?: NodeData | undefined;
  alias?: string;
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

export function findNode(localModelName: string, nodeId: string): ModelNode | undefined {
  return getDatamodelRoot(localModelName)?.findNodeById(nodeId);
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

export function refToNodeInModel(ref: Ref | undefined): NodeInModel | undefined {
  if (ref == null) {
    return undefined;
  }
  return {
    model: ref.data.model.qualifiedName,
    id: {
      regularId: ref.data.id.regularId,
    },
  };
}
