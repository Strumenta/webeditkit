import { NodeData } from './misc';
import { ModelNode } from './modelNode';

const datamodelRoots = {};
const datamodelClasses = {};

class Registry {
  static defaultBaseUrl : string | undefined = undefined;
}

export function setDefaultBaseUrl(value: string | undefined): void {
  Registry.defaultBaseUrl = value;
}

export function getDefaultBaseUrl(): string | undefined {
  return Registry.defaultBaseUrl;
}

///
/// DataModel classes registry
///

export function registerDataModelClass(conceptName: string, clazz: new (data: NodeData) => ModelNode): void {
  datamodelClasses[conceptName] = clazz;
}

export function dataToNode(data: NodeData): ModelNode {
  if (data === null) {
    return null;
  }
  const clazz = datamodelClasses[data.concept];
  if (clazz === undefined) {
    return new ModelNode(data);
  } else {
    return new clazz(data);
  }
}

///
/// DataModel roots
///

export function clearDatamodelRoots(): void {
  Object.keys(datamodelRoots).forEach((key) => {
    delete datamodelRoots[key];
  });
}

export function setDatamodelRoot(name: string, root: ModelNode): void {
  datamodelRoots[name] = root;
}

export function getDatamodelRoot(name: string): ModelNode {
  return datamodelRoots[name];
}

export function forEachDataModel(op: (localName: string, root: ModelNode) => void) {
  const keys = Object.keys(datamodelRoots);
  for (const key of keys) {
    op(key, getDatamodelRoot(key));
  }
}
