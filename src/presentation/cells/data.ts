import { PropertyValue } from '../../datamodel/misc';
import { ModelNode } from '../../datamodel';

export class EditedValue {
  inputFieldValue: string;
  inFlightValue: PropertyValue | undefined;
  inFlightRequestId: string | undefined;
}

export interface IEditedValuesStore {
  get(modelNode: ModelNode, propertyName: string): EditedValue | undefined;

  getOrCreate(modelNode: ModelNode, propertyName: string): EditedValue;

  delete(modelNode: ModelNode, propertyName: string): void;
}

/**
 * Stores information that must survive VNode and ModelNode updates.
 */
export interface IData {
  readonly editedValues: IEditedValuesStore;
}

export class EditedValuesStore implements IEditedValuesStore {
  private nodes: Map<string, Map<string, EditedValue>> = new Map<string, Map<string, EditedValue>>();

  get(modelNode: ModelNode, propertyName: string): EditedValue | undefined {
    return this.nodes.get(modelNode.idString())?.get(propertyName);
  }

  getOrCreate(modelNode: ModelNode, propertyName: string): EditedValue {
    const nodeId = modelNode.idString();
    let node = this.nodes.get(nodeId);
    if (node == null) {
      node = new Map<string, EditedValue>();
      this.nodes.set(nodeId, node);
    }

    let ev = node.get(propertyName);
    if (ev == null) {
      ev = new EditedValue();
      node.set(propertyName, ev);
    }

    return ev;
  }

  delete(modelNode: ModelNode, propertyName: string): void {
    const nodeId = modelNode.idString();
    const node = this.nodes.get(nodeId);
    if (node === undefined) {
      return;
    }
    if (!node.has(propertyName)) {
      return;
    }

    node.delete(propertyName);
    if (node.size === 0) {
      this.nodes.delete(nodeId);
    }
  }
}

export class Data implements IData {
  readonly editedValues = new EditedValuesStore();
}
