import { NodeId, NodeInModel } from '../internal';
import { IssueDescription } from '../internal';
import { domElementToModelNode } from '../internal';
import { getWsCommunication, Intention } from '../internal';
import { autoresize, myAutoresizeOptions, next, previous } from '../internal';

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
    this.myIntentionsMenu.parentElement?.removeChild(this.myIntentionsMenu);
  }

  protected indexOfNode(el: Element | null, selector: string) {
    let i = -1;
    while (el) {
      el = previous(el, selector);
      i++;
    }
    return i;
  }

  constructor(triggerElement: HTMLElement, intentions: Intention[]) {
    const domParser = new DOMParser();
    let node = domParser.parseFromString("<div id='intentions-menu'></div>", 'text/html');
    document.body.append(node);

    for (const i of intentions) {
      node = domParser.parseFromString(`<input value='${i.description}'><br>`, 'text/html');
      document.getElementById('intentions-menu')?.append(node);
    }

    // Otherwise the handler will kill also future intentions menus
    this.myIntentionsMenu = document.getElementById('intentions-menu') as HTMLDivElement;
    document.querySelector('#intentions-menu input')?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        intentions[this.indexOfNode(e.target as Element, 'input')].execute();
        this.deleteMenu();
      } else if (e.key === 'Escape') {
        this.deleteMenu();
      } else if (e.key === 'ArrowDown') {
        const dest = next(e.target as Element, 'input') as HTMLElement;
        if (dest) {
          dest.focus();
        }
      } else if (e.key === 'ArrowUp') {
        const dest = previous(e.target as Element, 'input') as HTMLElement;
        if (dest) {
          dest.focus();
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
      return isInIntentionsMenu(document.activeElement as HTMLElement);
    }

    function isInIntentionsMenu(element: HTMLElement) {
      return element && element.parentElement?.matches('#intentions-menu');
    }

    (document.querySelector('#intentions-menu input:first') as HTMLElement)?.focus();

    autoresize(document.querySelector('#intentions-menu input') as HTMLElement, myAutoresizeOptions);
    document.body.addEventListener('focusin', (e) => {
      if (!isInIntentionsMenu(e.target as HTMLElement)) {
        this.deleteMenu();
      }
    });
  }
}
