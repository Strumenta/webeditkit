import { dataToNode } from './registry';
import {
  getWsCommunication,
  modelNodeToNodeInModel,
  refToNodeInModel,
  WsCommunication
} from '../communication/wscommunication';
import {NodeData, nodeIdToString, PropertyValue} from './misc';
import { Ref } from './ref';
import {ReferenceChange} from "../communication/messages";
import {renderDataModels} from "../index";
import {uuidv4} from "../utils/misc";

export function reactToAReferenceChange(msg: ReferenceChange, root: ModelNode) {
  const node = dataToNode(root.data).findNodeById(nodeIdToString(msg.node.id));
  if (msg.referenceValue == null) {
    node.setRefLocally(msg.referenceName, null);
  } else {
    node.setRefLocally(msg.referenceName, new Ref({
      model: {qualifiedName: msg.referenceValue.model},
      id: msg.referenceValue.id
    }));
  }
  renderDataModels();
}

type NodeProcessor = (node: ModelNode) => void;
export type OptionalNodeProcessor = NodeProcessor | undefined;

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

  hasChild(linkName: string): boolean {
    return this.childByLinkName(linkName) != null;
  }

  setChild(linkName: string, child: ModelNode): void {
    if (this.hasChild(linkName)) {
      this.removeChild(linkName, child.data);
    }
    this.addChild(linkName, 0, child.data);
  }

  childrenByLinkName(linkName: string): ModelNode[] {
    const filtered = this.data.children.filter((el) => el.containingLink === linkName);
    return filtered.map((el) => dataToNode(el));
  }

  property(propertyName: string): PropertyValue | undefined {
    const value = this.data.properties[propertyName];
    // if (value == null) {
    //   throw new Error('Property ' + propertyName + ' not found');
    // }
    return value || undefined;
  }

  setRefLocally(referenceName: string, ref: Ref): void {
    if (ref == null) {
      this.data.refs[referenceName] = null;
    } else {
      this.data.refs[referenceName] = ref.data;
    }
  }

  root() : ModelNode | null {
    if (this.isRoot()) {
      return this;
    }
    if (this.parent() == null) {
      return null;
    }
    return this.parent().root();
  }

  setRef(referenceName: string, ref: Ref): void {
    const root = this.root();
    if (root == null) {
      throw new Error('Root not found');
    }
    reactToAReferenceChange({
      type: 'ReferenceChange',
      node: modelNodeToNodeInModel(this),
      referenceName,
      referenceValue: refToNodeInModel(ref)
    } as ReferenceChange, root);
    this.ws().communicateReferenceChange(this, referenceName, ref);
  }

  ref(referenceName: string): Ref | undefined {
    if (this.data.refs[referenceName] == null) {
      return undefined;
    }
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

  findNodeById(nodeIdStr: string): ModelNode | null {
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

  addChild(relationName: string, index: number, childData: NodeData) {
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

  createChild(containmentName: string, index: number, childConcept: string, initializer: OptionalNodeProcessor = undefined, uuid: string = uuidv4()) {
    this.ws().addChildAtIndex(this, containmentName, index, childConcept, initializer, uuid);
  }

  createSingleChild(containmentName: string, childConcept: string, initializer: OptionalNodeProcessor = undefined, uuid: string = uuidv4()) {
    this.ws().setChild(this, containmentName, childConcept, initializer, uuid);
  }

  insertNextSibling(): void {
    this.ws().insertNextSibling(this);
  }

  removeChild(relationName: string, childData: NodeData) {
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

  setProperty(propertyName: string, propertyValue: PropertyValue): void {
    this.data.properties[propertyName] = propertyValue;
  }

}