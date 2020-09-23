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