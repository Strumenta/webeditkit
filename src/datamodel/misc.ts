import { getDatamodelRoot } from './registry';
import { ModelNode } from './modelNode';


///
/// Node Data
///

interface EnumValue {
  myId: string;
  myNameHint: string;
}

export type PropertyType = string | boolean | number | EnumValue;

export type PropertiesValues = { [key: string]: PropertyType }

export interface NodeId {
  regularId: string;
}

export function nodeIdToString(nodeId: NodeId): string {
  return nodeId.regularId;
}

interface ModelId {
  qualifiedName: string;
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

// TODO merge with NodeInModel
export interface ReferenceData {
  model: ModelId;
  id: NodeId;
}


///
/// Node navigation
///

export function findNode(localModelName, nodeId): ModelNode | null {
  return getDatamodelRoot(localModelName).findNodeById(nodeId);
}
