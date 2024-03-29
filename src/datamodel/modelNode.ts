import { baseUrlForModelName, dataToNode, fixedCell, getDefaultBaseUrl, HttpCommunication, NodeId } from '../internal';
import { getWsCommunication } from '../internal';
import {
  LimitedNodeData,
  modelNodeToNodeInModel,
  NodeData,
  nodeIdToString,
  PropertyValue,
  refToNodeInModel,
  AlternativesProvider,
} from '../internal';
import { Ref } from '../internal';
import { ReferenceChange } from '../internal';
import { renderDataModels } from '../internal';
import { uuidv4 } from '../internal';
import { VNode } from 'snabbdom/vnode';

export function reactToAReferenceChange(msg: ReferenceChange, root: ModelNode): void {
  const node = root.findNodeById(nodeIdToString(msg.node.id));
  if (node == null) {
    return;
  }

  if (msg.referenceValue == null) {
    node.setRefLocally(msg.referenceName, undefined);
  } else {
    node.setRefLocally(
      msg.referenceName,
      new Ref({
        model: { qualifiedName: msg.referenceValue.model },
        id: msg.referenceValue.id,
      }),
    );
  }
  renderDataModels();
}

export type NodeProcessor = (node: ModelNode) => void;

export class LimitedModelNode {
  constructor(readonly limitedData: LimitedNodeData) {}

  isAbstract(): boolean {
    return this.limitedData.abstractConcept;
  }

  name(): string | undefined {
    return this.limitedData.name;
  }

  idString(): string {
    return this.limitedData.id.regularId;
  }

  conceptName(): string {
    return this.limitedData.concept;
  }
}

export class ModelNode extends LimitedModelNode {
  constructor(readonly data: NodeData) {
    super(data);
  }

  childByLinkName(linkName: string): ModelNode | undefined {
    const filtered = this.data.children.filter((el) => el.containingLink === linkName);
    if (filtered.length === 0) {
      return undefined;
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

  setRefLocally(referenceName: string, ref: Ref | undefined): void {
    if (ref == null) {
      delete this.data.refs[referenceName];
    } else {
      this.data.refs[referenceName] = ref.data;
    }
  }

  root(): ModelNode | null {
    if (this.isRoot()) {
      return this;
    }
    const parent = this.parent();
    if (parent == null) {
      return null;
    }
    return parent.root();
  }

  setRef(referenceName: string, ref: Ref | undefined): void {
    const root = this.root();
    if (root == null) {
      throw new Error('Root not found');
    }
    reactToAReferenceChange(
      {
        type: 'referenceChange',
        node: modelNodeToNodeInModel(this),
        referenceName,
        referenceValue: refToNodeInModel(ref),
      } as ReferenceChange,
      root,
    );
    this.ws().communicateReferenceChange(this, referenceName, ref);
  }

  ref(referenceName: string): Ref | undefined {
    if (this.data.refs[referenceName] == null) {
      return undefined;
    }
    return new Ref(this.data.refs[referenceName]);
  }

  findNodeById(nodeIdStr: string): ModelNode | undefined {
    if (nodeIdStr == null) {
      throw new Error("findNodeById: nodeIdStr should not be null");
    }
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
    return undefined;
  }

  get conceptAlias(): string | undefined {
    return this.data.conceptAlias;
  }

  simpleConceptName(): string {
    const parts = this.data.concept.split('.');
    return parts[parts.length - 1];
  }

  isAbstract(): boolean {
    return this.data.abstractConcept;
  }

  injectModelName(modelName: string, rootName: string | undefined): void {
    this.data.rootName = rootName;
    this.data.modelName = modelName;
    const parent = this;
    for (const el of this.data.children) {
      el.parent = parent.data;
      dataToNode(el).injectModelName(modelName, rootName);
    }
  }

  modelName(): string {
    return this.data.modelName;
  }

  rootName(): string | undefined {
    return this.data.rootName;
  }

  index(): number {
    if (this.isRoot()) {
      throw new Error('Cannot get index of root');
    }
    const parent = this.parent();
    if (parent == null) {
      throw new Error('Cannot get index when parent is not set');
    }
    const containmentName = this.containmentName();
    if (containmentName == null) {
      throw new Error('Cannot get index when containment name is null');
    }
    const siblings = parent.childrenByLinkName(containmentName);
    for (let i = 0; i < siblings.length; i++) {
      if (this.idString() === siblings[i].idString()) {
        return i;
      }
    }
    throw new Error('This element was not found among the children of its parent');
  }

  addChild(relationName: string, index: number, childData: NodeData): void {
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
      throw new Error(`Invalid index ${index} in relation ${relationName}`);
    }

    this.data.children.splice(i, 0, childData);
    childData.parent = this.data;
    dataToNode(childData).injectModelName(this.data.modelName, this.data.rootName);
  }

  createChild(
    containmentName: string,
    index: number,
    childConcept: string,
    initializer?: NodeProcessor,
    nodeId?: NodeId,
    uuid: string = uuidv4(),
  ): void {
    this.ws().addChildAtIndex(this, containmentName, index, childConcept, undefined, initializer, nodeId, uuid);
  }

  moveMe(index: number) : void {
    this.ws().moveChild(this, index);
  }

  createSingleChild(
    containmentName: string,
    childConcept: string,
    initializer?: NodeProcessor,
    uuid: string = uuidv4(),
  ): void {
    this.ws().setChild(this, containmentName, childConcept, undefined, initializer, uuid);
  }

  insertNextSibling(conceptName?: string): void {
    this.ws().insertNextSibling(this, conceptName);
  }

  removeChild(relationName: string, childData: NodeData): void {
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

  executeAction(actionName: string, params?: {[key:string]:string}) : Promise<any> {
    const mn = this.modelName();
    if (mn == null) {
      throw new Error("model name not obtained");
    }
    console.log("modelNode executeAction", mn, this.idString(), actionName, params);
    return this.http().executeAction(mn, this.idString(), actionName, params);
  }

  private ws() {
    return getWsCommunication(this.modelName());
  }

  private http() {
    let baseUrl = baseUrlForModelName(this.modelName()) || getDefaultBaseUrl();
    if (baseUrl == null) {
      throw new Error(
        'No base url specified for model ' + this.modelName() + ' and no default base url available',
      );
    }
    if (!baseUrl.startsWith('http://')) {
      baseUrl = 'http://' + baseUrl;
    }
    console.log("modelNode http", baseUrl);
    return new HttpCommunication(baseUrl);
  }

  deleteMe(): void {
    this.ws().deleteNode(this);
  }

  isRoot(): boolean {
    return this.data.containingLink == null;
  }

  setProperty(propertyName: string, propertyValue: PropertyValue): void {
    this.data.properties[propertyName] = propertyValue;
  }

  constant(
    value: string,
    extraClasses?: string[],
    alternativesProvider?: AlternativesProvider,
    deleter?: (doDelete: boolean) => void,
    onEnter?: () => void,
  ): VNode {
    return fixedCell(this, value, extraClasses, alternativesProvider, deleter, onEnter);
  }

  conceptAliasCell(): VNode {
    return this.constant(this.conceptAlias as string);
  }
}

// Weirdly enough, without this comment I get a compilation error...
