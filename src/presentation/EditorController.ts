import { NodeId, NodeInModel } from '../datamodel/misc';
import { IssueDescription } from '../communication/messages';
import { domElementToModelNode } from './cells/support';
import { getWsCommunication, Intention } from '../communication/wscommunication';
import { myAutoresizeOptions } from './uiutils';

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

  async triggerIntentionsMenu(event: Event): Promise<void> {
    const modelNode = domElementToModelNode(event.target as HTMLElement);
    if (modelNode == null) {
      // nothing to do here
    } else {
      const intentions = await getWsCommunication(modelNode.modelName()).getIntentions(modelNode);
      const intentionsMenu = new IntentionsMenu(event.target as HTMLElement, intentions);
    }
  }
}

const instance = new EditorController();

export function editorController(): EditorController {
  return instance;
}

class IntentionsMenu {
  private myIntentionsMenu: HTMLDivElement;

  deleteMenu() {
    $(this.myIntentionsMenu).remove();
  }

  constructor(triggerElement: HTMLElement, intentions: Intention[]) {
    $('body').append("<div id='intentions-menu'></div>");

    for (const i of intentions) {
      $('#intentions-menu').append(`<input value='${i.description}'><br>`);
    }

    // Otherwise the handler will kill also future intentions menus
    this.myIntentionsMenu = $('#intentions-menu')[0] as HTMLDivElement;
    $('#intentions-menu input').keydown((e) => {
      if (e.key === 'Enter') {
        const index = $(e.target).prevAll('input').length;
        intentions[index].execute();
        this.deleteMenu();
      } else if (e.key === 'Escape') {
        this.deleteMenu();
      } else if (e.key === 'ArrowDown') {
        const dest = $(e.target).nextAll('input');
        if (dest.length > 0) {
          $(dest[0]).focus();
        }
      } else if (e.key === 'ArrowUp') {
        const dest = $(e.target).prevAll('input');
        if (dest.length > 0) {
          $(dest[0]).focus();
        }
      }
      e.preventDefault();
      return false;
    });
    const left = triggerElement.getBoundingClientRect().left;
    const top = triggerElement.getBoundingClientRect().bottom;
    this.myIntentionsMenu.style.left = `${left}px`;
    this.myIntentionsMenu.style.top = `${top}px`;

    function focusOnIntentionsMenu() {
      return isInIntentionsMenu($(document.activeElement as HTMLElement).first());
    }

    function isInIntentionsMenu(element: JQuery | HTMLElement) {
      const res = $(element).parent('#intentions-menu').length;
      return res > 0;
    }

    $('#intentions-menu input:first').focus();

    // @ts-ignore
    $('#intentions-menu input').autoresize(myAutoresizeOptions);
    $('body').focusin((e) => {
      if (!isInIntentionsMenu(e.target)) {
        this.deleteMenu();
      }
    });
  }
}
