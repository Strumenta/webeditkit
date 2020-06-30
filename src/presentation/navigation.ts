import { log } from '../utils/misc';

function triggerFocus(element: HTMLInputElement) {
  const eventType = "onfocusin" in element ? "focusin" : "focus";
  const bubbles = "onfocusin" in element;
  let event;

  if ("createEvent" in document) {
    event = document.createEvent("Event");
    event.initEvent(eventType, bubbles, true);
  } else if ("Event" in window) {
    event = new Event(eventType, { bubbles, cancelable: true });
  }

  element.focus();
  // @ts-ignore
  element.dispatchEvent(event);
}

function moveFocusToStart(next: HTMLInputElement) {
  // @ts-ignore
  triggerFocus(next);
  if (next.setSelectionRange) {
    next.setSelectionRange(0,0);
  }
}

function moveFocusToEnd(next: HTMLInputElement) {
  // @ts-ignore
  triggerFocus(next);
  if (next.setSelectionRange) {
    const text = next.value;
    next.setSelectionRange(text.length, text.length);
  }
}

function findNext(n: Element): Element | null {
  const candidate = n.nextElementSibling;
  if (!candidate) {
    const p = n.parentElement;
    if (!p || p.classList.contains('editor')) {
      return null;
    } else {
      return findNext(p);
    }
  } else {
    return candidate;
  }
}

function findPrev(n: Element): Element | null {
  const candidate = n.previousElementSibling;
  if (!candidate) {
    const p = n.parentElement;
    if (!p || p.classList.contains('editor')) {
      return null;
    } else {
      return findPrev(p);
    }
  } else {
    return candidate;
  }
}

function selectFirstElementInRow(row: HTMLElement, focusOnEnd: boolean): void {
  log('selectFirstElementInRow', row);
  // @ts-ignore
  window.sf = row;
  if ($(row).children('input').length > 0) {
    $($(row).children('input')[0]).trigger('focus');
  } else {
    const children = $(row).children();
    if (focusOnEnd) {
      for (let i = children.length - 1; i >= 0; i--) {
        if ($(children[i]).find('input').length > 0) {
          // there is an input somewhere here, we should dive into this
          return selectFirstElementInRow(children[i], focusOnEnd);
        }
      }
    } else {
      for (const child of children) {
        if ($(child).find('input').length > 0) {
          // there is an input somewhere here, we should dive into this
          return selectFirstElementInRow(child, focusOnEnd);
        }
      }
    }
    throw new Error('This should not happen');
  }
}

export function moveUp(t: HTMLElement): void {
  if ($(t).hasClass('editor')) {
    return;
  }
  log('move up');
  // @ts-ignore
  window.mu = t;
  // @ts-ignore
  const l = $(t).closest('.row,.vertical-collection');
  if (l.length === 0) {
    console.warn('no line found');
  } else if (l.length > 1) {
    console.warn('too many lines found');
  } else {
    log('element found');
    let nextLine = l;
    do {
      log(' before', nextLine);
      nextLine = $(nextLine).prev('.row,.vertical-collection');
      log(' after', nextLine);
    } while (nextLine.length === 1 && $(nextLine).find('input').length === 0);
    if (nextLine.length === 1) {
      selectFirstElementInRow(nextLine[0], true);
    } else if (t.parentElement != null) {
      moveUp(t.parentElement);
    }
    // We must find the previous line and pick the first element there
  }
}

export function moveDown(t: HTMLElement): void {
  if ($(t).hasClass('editor')) {
    return;
  }
  log('move down', t);
  // @ts-ignore
  window.mu = t;
  // @ts-ignore
  const l = $(t).closest('.row,.vertical-collection');
  if (l.length === 0) {
    console.warn('no line found');
  } else if (l.length > 1) {
    console.warn('too many lines found');
  } else {
    log('element found');
    let nextLine = l;
    do {
      log(' before', nextLine);
      nextLine = $(nextLine).next('.row,.vertical-collection');
      log(' after', nextLine);
    } while (nextLine.length === 1 && $(nextLine).find('input').length === 0);
    if (nextLine.length === 1) {
      selectFirstElementInRow(nextLine[0], false);
    } else if (t.parentElement != null) {
      moveDown(t.parentElement);
    }
    // We must find the previous line and pick the first element there
  }
}

function canBeAccepted(elConsidered: Element, onlyEditable: boolean): boolean {
  if (onlyEditable) {
    return !elConsidered.classList.contains('fixed');
  } else {
    return true;
  }
}

/**
 * Return true if we manage to find a next element
 */
export function moveToNextElement(t: HTMLElement, onlyEditable = false): boolean {
  let elConsidered = findNext(t);
  while (elConsidered != null) {
    const tag = elConsidered.tagName;
    if (tag === 'INPUT') {
      if (canBeAccepted(elConsidered, onlyEditable)) {
        moveFocusToStart(elConsidered as HTMLInputElement);
        return true;
      } else {
        elConsidered = findNext(elConsidered);
      }
    } else if (tag === 'DIV' || tag === 'SPAN') {
      if (!elConsidered.querySelector('input')) {
        elConsidered = findNext(elConsidered);
      } else {
        elConsidered = elConsidered.querySelector('input') as Element;
        if (canBeAccepted(elConsidered, onlyEditable)) {
          moveFocusToStart(elConsidered as HTMLInputElement);
          return true;
        } else {
          elConsidered = findNext(elConsidered);
        }
      }
    } else {
      // Perhaps we could play an error sound
      return false;
    }
  }
  return false;
}

export function moveToPrevElement(t: HTMLElement, onlyEditable = false): boolean {
  let elConsidered = findPrev(t);
  while (elConsidered != null) {
    const tag = elConsidered.tagName;
    if (tag === 'INPUT') {
      if (canBeAccepted(elConsidered, onlyEditable)) {
        moveFocusToEnd(elConsidered as HTMLInputElement);
        return true;
      } else {
        elConsidered = findPrev(elConsidered);
      }
    } else if (tag === 'DIV' || tag === 'SPAN') {
      if (!elConsidered.querySelector('input')) {
        elConsidered = findPrev(elConsidered);
      } else {
        const inputs = elConsidered.querySelectorAll('input');
        elConsidered = inputs[inputs.length - 1];
        if (canBeAccepted(elConsidered, onlyEditable)) {
          moveFocusToEnd(elConsidered as HTMLInputElement);
          return true;
        } else {
          elConsidered = findPrev(elConsidered);
        }
      }
    } else {
      // Perhaps we could play an error sound
      return false;
    }
  }
  return false;
}

export function isAtEnd(element: HTMLInputElement): boolean {
  const cursorPos = element.selectionStart;
  const length = element.value.length;
  return cursorPos === length;
}

export function isAtStart(element: HTMLInputElement): boolean {
  const cursorPos = element.selectionStart;
  return cursorPos === 0;
}
