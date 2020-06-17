import { log } from '../utils/misc';

function moveFocusToStart(next: JQuery) {
  next.trigger('focus');
  const el = next[0];
  if (el !== undefined && (el as HTMLInputElement).setSelectionRange != null) {
    (el as HTMLInputElement).setSelectionRange(0, 0);
  }
}

function moveFocusToEnd(next: JQuery) {
  next.trigger('focus');
  const el = next[0];
  if (el !== undefined && (el as HTMLInputElement).setSelectionRange != null) {
    const text = next.val() as string;
    (el as HTMLInputElement).setSelectionRange(text.length, text.length);
  }
}

function findNext(n: JQuery): JQuery | null {
  const candidate = n.next();
  if (candidate.length === 0) {
    const p = n.parent();
    if (p == null || p.hasClass('editor')) {
      return null;
    } else {
      return findNext(p);
    }
  } else {
    return candidate;
  }
}

function findPrev(n: JQuery): JQuery | null {
  const candidate = n.prev();
  if (candidate == null || candidate.length === 0) {
    const p = $(n).parent();
    if (p == null || $(p).hasClass('editor')) {
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

function canBeAccepted(elConsidered: JQuery, onlyEditable: boolean): boolean {
  if (onlyEditable) {
    return !elConsidered.hasClass('fixed');
  } else {
    return true;
  }
}

/**
 * Return true if we manage to find a next element
 */
export function moveToNextElement(t: HTMLElement, onlyEditable = false): boolean {
  let elConsidered = findNext($(t));
  while (elConsidered != null) {
    const tag = elConsidered.prop('tagName') as string;
    if (tag === 'INPUT') {
      if (canBeAccepted(elConsidered, onlyEditable)) {
        moveFocusToStart(elConsidered);
        return true;
      } else {
        elConsidered = findNext(elConsidered);
      }
    } else if (tag === 'DIV' || tag === 'SPAN') {
      if (elConsidered.find('input').length === 0) {
        elConsidered = findNext(elConsidered);
      } else {
        elConsidered = elConsidered.find('input').first();
        if (canBeAccepted(elConsidered, onlyEditable)) {
          moveFocusToStart(elConsidered);
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
  let elConsidered = findPrev($(t));
  while (elConsidered != null) {
    const tag = elConsidered.prop('tagName') as string;
    if (tag === 'INPUT') {
      if (canBeAccepted(elConsidered, onlyEditable)) {
        moveFocusToEnd(elConsidered);
        return true;
      } else {
        elConsidered = findPrev(elConsidered);
      }
    } else if (tag === 'DIV' || tag === 'SPAN') {
      if (elConsidered.find('input').length === 0) {
        elConsidered = findPrev(elConsidered);
      } else {
        elConsidered = elConsidered.find('input').last();
        if (canBeAccepted(elConsidered, onlyEditable)) {
          moveFocusToEnd(elConsidered);
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
