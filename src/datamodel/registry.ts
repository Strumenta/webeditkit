import { NodeData, NodeInModel } from './misc';
import { ModelNode } from './modelNode';

const datamodelRoots = new Map<string, ModelNode>();
const datamodelClasses = {};

class Registry {
  static defaultBaseUrl: string | undefined = undefined;
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
  datamodelRoots.clear();
}

export function setDatamodelRoot(name: string, root: ModelNode): void {
  datamodelRoots.set(name, root);
}

export function getDatamodelRoot(name: string): ModelNode | undefined {
  return datamodelRoots.get(name);
}

export function forEachDataModel(op: (localName: string, root: ModelNode) => void) {
  datamodelRoots.forEach((value, key) => op(key, value));
}

export function getNodeFromLocalRepo(nodeId: NodeInModel): ModelNode | undefined {
  for (const [, entry] of datamodelRoots.entries()) {
    if (entry.modelName() === nodeId.model) {
      const res = entry.findNodeById(nodeId.id.regularId);
      if (res != null) {
        return res;
      }
    }
  }
  return undefined;
}
