export interface ReferenceDef {
  linkName: string;
  to: string;
}

export interface Node {
  properties: { [key: string]: string };
  children: Node[];
  references: ReferenceDef[];
  conceptName: string;
  id: string;
  containmentLinkName: string;
}

export interface Model {
  roots: Node[];
  name: string;
  uuid: string;
}

export class Resolver {
  private model: Model;
  private idToNode: { [id: string]: Node } = {};

  processNode(node: Node) {
    this.idToNode[node.id] = node;
    node.children.forEach((value: Node) => this.processNode(value));
  }

  constructor(model: Model) {
    this.model = model;
    this.model.roots.forEach((value: Node) => this.processNode(value));
  }

  resolve(ref: ReferenceDef): Node | null {
    if (ref.to.startsWith('int:')) {
      const id = ref.to.substring('int:'.length);
      return this.idToNode[id];
    } else {
      return null;
    }
  }
}

export class SResolver {
  private model: SModel;
  private idToNode: { [id: string]: SNode } = {};

  processNode(node: SNode) {
    this.idToNode[node.id()] = node;
    node.children().forEach((value: SNode) => this.processNode(value));
  }

  constructor(model: SModel) {
    this.model = model;
    this.model.roots().forEach((value: SNode) => this.processNode(value));
  }

  resolve(ref: ReferenceDef): SNode | null {
    if (ref.to.startsWith('int:')) {
      const id = ref.to.substring('int:'.length);
      return this.idToNode[id];
    } else {
      return null;
    }
  }
}

export function child(node: Node, linkName: string): Node | null {
  const selected = node.children.filter((value) => value.containmentLinkName === linkName);
  if (selected.length === 0) {
    return null;
  } else if (selected.length === 1) {
    return selected[0];
  } else {
    throw new Error('Too many matching children');
  }
}

export function property(node: Node, propertyName: string): string | null {
  return node.properties[propertyName];
}

export function nodeName(node: Node): string | null {
  return property(node, 'name');
}

export function reference(node: Node, linkName: string): ReferenceDef | null {
  const selected = node.references.filter((value) => value.linkName === linkName);
  if (selected.length === 0) {
    return null;
  } else if (selected.length === 1) {
    return selected[0];
  } else {
    throw new Error('Too many matching children');
  }
}

export class SNode {
  model: SModel;
  data: Node;
  parent: SNode | null;
  constructor(data: Node, container: SModel | SNode) {
    this.data = data;
    if (container instanceof SModel) {
      this.model = container;
      this.parent = null;
    } else if (container instanceof SNode) {
      this.model = container.model;
      this.parent = container;
    } else throw new Error();
  }
  conceptName() : string {
    return this.data.conceptName;
  }
  name() : string | null {
    return nodeName(this.data);
  }
  id() : string {
    return this.data.id;
  }
  children() : SNode[] {
    return this.data.children.map((c:Node)=>new SNode(c, this));
  }
  reference(name: string) : ReferenceDef | null {
    return reference(this.data, name);
  }
  property(name: string) : string | null {
    return property(this.data, name);
  }
  containmentLinkName() : string | null {
    return this.data.containmentLinkName;
  }
}

export class SModel {
  data: Model;
  constructor(data: Model) {
    this.data = data;
  }
  roots() : SNode[] {
    return this.data.roots.map((n)=> new SNode(n, this));
  }
  name() : string {
    return this.data.name;
  }
  findRootById(nodeId: string) : SNode | undefined {
    return this.roots().find((r:SNode) => r.id() === nodeId)
  }
}