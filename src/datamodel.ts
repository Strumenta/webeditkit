import { getWsCommunication } from './wscommunication';
import { baseUrlForModelName } from './webeditkit';

const datamodelRoots = {};
const datamodelClasses = {};

///
/// Node Data
///

export type PropertyType = string | boolean | number;

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
  properties: { [key: string]: PropertyType };
  children: NodeData[];
  concept: string;
  containingLink?: string;
  id: NodeId;
  refs: { [key: string]: ReferenceData };
  rootName?: string;
  modelName?: string; // The qualified model name
  parent?: NodeData;
}

interface ReferenceData {
  model: ModelId;
  id: NodeId;
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
/// DataModel classes
///

export class Ref {
  private data: ReferenceData;

  constructor(data: ReferenceData) {
    if (data == null) {
      throw new Error('Ref cannot be built with null data');
    }
    this.data = data;
  }

  loadData(cb) {
    const baseUrl = baseUrlForModelName(this.data.model.qualifiedName);
    const url = 'http://' + baseUrl + '/models/' + this.data.model.qualifiedName + '/' + this.data.id.regularId;
    $.getJSON(url, (data) => {
      if (data == null) {
        throw new Error('Data not received correctly on request to ' + url);
      }
      cb(dataToNode(data));
    });
  }
}

export class ModelNode {
  readonly data: NodeData;

  constructor(data: NodeData) {
    this.data = data;
  }

  childByLinkName(linkName): ModelNode {
    const filtered = this.data.children.filter((el) => el.containingLink === linkName);
    if (filtered.length === 0) {
      return null;
    } else if (filtered.length === 1) {
      return dataToNode(filtered[0]);
    } else {
      throw new Error('Unexpected to find multiple children for link name ' + linkName);
    }
  }

  childrenByLinkName(linkName: string): ModelNode[] {
    const filtered = this.data.children.filter((el) => el.containingLink === linkName);
    return filtered.map((el) => dataToNode(el));
  }

  property(propertyName: string): PropertyType | undefined {
    const value = this.data.properties[propertyName];
    // if (value == null) {
    //   throw new Error('Property ' + propertyName + ' not found');
    // }
    return value || undefined;
  }

  ref(referenceName: string): Ref {
    return new Ref(this.data.refs[referenceName]);
  }

  name(): string | undefined {
    const value = this.property('name');
    if (value == null) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value;
    }
    throw new Error('Name was expected to be a string, while it is ' + value);
  }

  idString(): string {
    return this.data.id.regularId;
  }

  conceptName(): string {
    return this.data.concept;
  }

  findNodeById(nodeIdStr): ModelNode | null {
    if (this.idString() === nodeIdStr.toString()) {
      return this;
    }
    for (const childData of this.data.children) {
      const child = dataToNode(childData);
      const childRes = child.findNodeById(nodeIdStr);
      if (childRes != null) {
        return childRes;
      }
    }
    return null;
  }

  simpleConceptName(): string {
    const parts = this.data.concept.split('.');
    return parts[parts.length - 1];
  }

  isAbstract(): boolean {
    return this.data.abstractConcept;
  }

  injectModelName(modelName, rootName): void {
    this.data.rootName = rootName;
    this.data.modelName = modelName;
    const parent = this;
    for (const el of this.data.children) {
      el.parent = parent.data;
      dataToNode(el).injectModelName(modelName, rootName);
    }
  }

  modelName() {
    return this.data.modelName;
  }

  rootName() {
    return this.data.rootName;
  }

  index(): number {
    if (this.isRoot()) {
      throw new Error('Cannot get index of root');
    }
    if (this.parent() == null) {
      throw new Error('Cannot get index when parent is not set');
    }
    const siblings = this.parent().childrenByLinkName(this.containmentName());
    for (let i = 0; i < siblings.length; i++) {
      if (this.idString() === siblings[i].idString()) {
        return i;
      }
    }
    throw new Error('This element was not found among the children of its parent');
  }

  addChild(relationName, index, childData) {
    const children = this.data.children;
    let leftToFind = index;
    let i = 0;
    for (; i < children.length && leftToFind > 0; i++) {
      const child = children[i];
      if (child.containingLink === relationName) {
        leftToFind--;
      }
    }
    if (leftToFind > 0) {
      throw new Error('Invalid index ' + index + ' in relation ' + relationName);
    }

    this.data.children.splice(i, 0, childData);
    childData.parent = this.data;
    dataToNode(childData).injectModelName(this.data.modelName, this.data.rootName);
  }

  createChild(containmentName: string, index: number, childConcept: string) {
    this.ws().addChildAtIndex(this, containmentName, index, childConcept);
  }

  insertNextSibling(): void {
    this.ws().insertNextSibling(this);
  }

  removeChild(relationName, childData) {
    for (let i = 0; i < this.data.children.length; i++) {
      const child = this.data.children[i];
      if (child.id.regularId === childData.id.regularId) {
        this.data.children.splice(i, 1);
        return;
      }
    }
    throw new Error('Child not found ' + JSON.stringify(childData));
  }

  containmentName(): string | null {
    return this.data.containingLink || null;
  }

  parent(): ModelNode | undefined {
    if (this.data.parent == null) {
      return undefined;
    }
    return dataToNode(this.data.parent);
  }

  private ws() {
    return getWsCommunication(this.modelName());
  }

  deleteMe() {
    this.ws().deleteNode(this);
  }

  isRoot(): boolean {
    return this.data.containingLink == null;
  }

  setProperty(propertyName: string, propertyValue: PropertyType) : void {
    this.data.properties[propertyName] = propertyValue;
  }
}

///
/// DataModel roots
///

export function setDatamodelRoot(name: string, root: ModelNode) : void {
  datamodelRoots[name] = root;
}

export function getDatamodelRoot(name: string): ModelNode {
  return datamodelRoots[name];
}

export function forEachDataModel(op) {
  const keys = Object.keys(datamodelRoots);
  for (const key of keys) {
    op(key, getDatamodelRoot(key));
  }
}

///
/// Node navigation
///

export function findNode(localModelName, nodeId) : ModelNode | null {
  return getDatamodelRoot(localModelName).findNodeById(nodeId);
}
