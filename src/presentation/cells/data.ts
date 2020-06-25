import { PropertyValue } from '../../datamodel/misc';
import { ModelNode } from '../../datamodel';
import {Subject} from "rxjs";
import {debounceTime} from "rxjs/operators";
import {uuidv4} from "../../utils/misc";
import {getWsCommunication} from "../../communication";

export class EditedValue {
  inputFieldValue: string;
  inFlightValue: PropertyValue | undefined;
  inFlightRequestId: string | undefined;
  readonly edits = new Subject<string>();

  set value(value: string) {
    this.inputFieldValue = value;
    this.edits.next(value);
  }
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
      const capturedEv = ev;
      const subscription = ev.edits.pipe(debounceTime(500)).subscribe(() => {
        const requestId = uuidv4();
        capturedEv.inFlightRequestId = requestId;
        capturedEv.inFlightValue = capturedEv.inputFieldValue;

        getWsCommunication(modelNode.modelName()).triggerChangeOnPropertyNode(
            modelNode,
            propertyName,
            capturedEv.inputFieldValue,
            () => {
              const currentEV = this.get(modelNode, propertyName);

              if (currentEV == null || currentEV?.inFlightRequestId !== requestId) {
                // Ignore response to an outdated request
                return;
              }

              if (currentEV.inFlightValue === currentEV.inputFieldValue) {
                this.delete(modelNode, propertyName);
                subscription.unsubscribe();
              } else {
                currentEV.inFlightValue = undefined;
                currentEV.inFlightRequestId = undefined;
              }
            },
        );
      });
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
