import { NodeId, NodeInModel } from '../datamodel/misc';
import { IssueDescription } from '../communication/messages';

export interface Observer {
  hoverNodeSet(node: NodeId | undefined): void;
  errorsForNodeSet(node: NodeInModel, errors: IssueDescription[]): void;
}

export class ObserverAdapter implements Observer {
  hoverNodeSet(node: NodeId | undefined): void {
    // doing nothing
  }

  errorsForNodeSet(node: NodeInModel, errors: IssueDescription[]): void {
    // doing nothing
  }
}

export class EditorController {
  private observers: Observer[] = [];

  setHoverNode(node: NodeId | undefined): void {
    for (const o of this.observers) {
      o.hoverNodeSet(node);
    }
  }
  registerObserver(observer: Observer): void {
    this.observers.push(observer);
  }

  notifyErrorsForNode(node: NodeInModel, errors: IssueDescription[]): void {
    for (const o of this.observers) {
      o.errorsForNodeSet(node, errors);
    }
  }
}

const instance = new EditorController();

export function editorController(): EditorController {
  return instance;
}
