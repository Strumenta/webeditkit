import { getWsCommunication } from './wscommunication';

const datamodelRoots = {};
const datamodelClasses = {};

///
/// DataModel classes registry
///

export function registerDataModelClass(name: string, clazz): void {
  datamodelClasses[name] = clazz;
}

export function dataToNode(data) {
  if (data == null) {
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
  private data: any;
  constructor(data) {
    if (data == null || data === undefined) {
      throw new Error('Ref cannot be built with null data');
    }
    this.data = data;
  }
  loadData(cb) {
    // TODO fixme, this address should not be set in this way...
    const url = 'http://localhost:2904/models/' + this.data.model.qualifiedName + '/' + this.data.id.regularId;
    $.getJSON(url, (data) => {
      if (data == null) {
        throw new Error('Data not received correctly on request to ' + url);
      }
      cb(dataToNode(data));
    });
  }
}

export class ModelNode {
  readonly data: any;
  constructor(data) {
    this.data = data;
  }
  childByLinkName(linkName) {
    const filtered = this.data.children.filter((el) => el.containingLink === linkName);
    if (filtered.length === 0) {
      return null;
    } else if (filtered.length === 1) {
      return dataToNode(filtered[0]);
    } else {
      throw new Error('Unexpected to find multiple children for link name ' + linkName);
    }
  }
  childrenByLinkName(linkName) {
    const filtered = this.data.children.filter((el) => el.containingLink === linkName);
    return $(filtered).map(function () {
      return dataToNode(this);
    });
  }
  property(propertyName) {
    return this.data.properties[propertyName];
  }
  ref(referenceName) {
    return new Ref(this.data.refs[referenceName]);
  }
  name() {
    return this.property('name');
  }
  idString() {
    return this.data.id.regularId;
  }
  conceptName() {
    return this.data.concept;
  }
  findNodeById(nodeIdStr) {
    if (this.idString() === nodeIdStr.toString()) {
      return this;
    }
    for (let i = 0; i < this.data.children.length; i++) {
      const child = dataToNode(this.data.children[i]);
      const childRes = child.findNodeById(nodeIdStr);
      if (childRes != null) {
        return childRes;
      }
    }
    return null;
  }
  simpleConceptName() {
    const parts = this.data.concept.split('.');
    const simpleName = parts[parts.length - 1];
    return simpleName;
  }
  isAbstract() {
    return this.data.abstractConcept;
  }
  injectModelName(modelName, rootName) {
    this.data.rootName = rootName;
    this.data.modelName = modelName;
    const parent = this;
    $(this.data.children).each(function () {
      this.parent = parent.data;
      dataToNode(this).injectModelName(modelName, rootName);
    });
  }
  modelName() {
    return this.data.modelName;
  }
  rootName() {
    return this.data.rootName;
  }
  index(): number {
    const siblings = this.parent().childrenByLinkName(this.containmentName());
    for (let i = 0; i < siblings.length; i++) {
      if (this.idString() == siblings[i].idString()) {
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
      if (child.containingLink == relationName) {
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

  createChild(containmentName: string, index: number, childConcept : string) {
    this.ws().addChildAtIndex(this, containmentName, index, childConcept);
  }

  insertNextSibling() : void {
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

  containmentName() {
    return this.data.containingLink;
  }
  parent() {
    return dataToNode(this.data.parent);
  }
  private ws() {
    return getWsCommunication(this.modelName());
  }
  deleteMe() {
    this.ws().deleteNode(this);
  }
}

///
/// DataModel roots
///

export function setDatamodelRoot(name, root) {
  datamodelRoots[name] = root;
}

export function getDatamodelRoot(name) : ModelNode {
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

export function findNode(localModelName, nodeId) {
  return getDatamodelRoot(localModelName).findNodeById(nodeId);
}
