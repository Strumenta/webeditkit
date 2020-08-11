import { log } from '../internal';
import { next, previous, triggerFocus } from '../internal';

function moveFocusToStart(el: HTMLInputElement) {
  // @ts-ignore
  triggerFocus(el);
  if (el.setSelectionRange) {
    el.setSelectionRange(0, 0);
  }
}

function moveFocusToEnd(el: HTMLInputElement) {
  // @ts-ignore
  triggerFocus(el);
  if (el.setSelectionRange) {
    const text = el.value;
    el.setSelectionRange(text.length, text.length);
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

function selectFirstElementInRow(row: Element, focusOnEnd: boolean): void {
  log('selectFirstElementInRow', row);
  // @ts-ignore
  window.sf = row;
  const input = row.querySelector(':scope > input') as HTMLInputElement;
  if (input) {
    triggerFocus(input);
  } else {
    const children = row.children;
    if (focusOnEnd) {
      for (let i = children.length - 1; i >= 0; i--) {
        if (children[i].querySelector('input')) {
          // there is an input somewhere here, we should dive into this
          return selectFirstElementInRow(children[i], focusOnEnd);
        }
      }
    } else {
      for (const child of children) {
        if (child.querySelector('input')) {
          // there is an input somewhere here, we should dive into this
          return selectFirstElementInRow(child, focusOnEnd);
        }
      }
    }
    throw new Error('This should not happen');
  }
}

export function moveUp(t: HTMLElement): void {
  if (t.classList.contains('editor')) {
    return;
  }
  log('move up');
  // @ts-ignore
  window.mu = t;
  // @ts-ignore
  const l = t.closest('.row,.vertical-collection');
  if (!t) {
    console.warn('no line found');
  } else {
    log('element found');
    let nextLine = l;
    do {
      log(' before', nextLine);
      nextLine = previous(nextLine, '.row,.vertical-collection');
      log(' after', nextLine);
    } while (nextLine && nextLine.querySelector('input'));
    if (nextLine) {
      selectFirstElementInRow(nextLine, true);
    } else if (t.parentElement != null) {
      moveUp(t.parentElement);
    }
    // We must find the previous line and pick the first element there
  }
}

export function moveDown(t: HTMLElement): void {
  if (t.classList.contains('editor')) {
    return;
  }
  log('move down', t);
  // @ts-ignore
  window.mu = t;
  // @ts-ignore
  const l = t.closest('.row,.vertical-collection');
  if (!l) {
    console.warn('no line found');
  } else {
    log('element found');
    let nextLine: Element | null = l;
    do {
      log(' before', nextLine);
      nextLine = next(nextLine, '.row,.vertical-collection');
      log(' after', nextLine);
    } while (nextLine && nextLine.querySelector('input'));
    if (nextLine) {
      selectFirstElementInRow(nextLine, false);
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
