function moveFocusToStart(next) {
  next.focus();
  const el = next[0];
  if (el !== undefined && el.setSelectionRange != null) {
    el.setSelectionRange(0, 0);
  }
}

function moveFocusToEnd(next) {
  next.focus();
  const el = next[0];
  if (el !== undefined && el.setSelectionRange != null) {
    const text = next.val();
    el.setSelectionRange(text.length, text.length);
  }
}

function findNext(n) {
  if (n.next() === undefined) {
    return undefined;
  } else {
    return n.next();
  }
}

export function moveUp(t) {
  // @ts-ignore
  const l = $(t).closest('.line');
  if (l.length === 0) {
    console.warn('no line found');
  } else if (l.length > 1) {
    console.warn('too many lines found');
  } else {
    console.log('element found');
    // We must find the previous line and pick the first element there
  }
}

export function moveDown(t) {}

export function moveToNextElement(t): boolean {
  let next = $(t).next();
  if (next.length === 0) {
    const parent = $(t).parent();
    if (parent.hasClass('editor')) {
      // cannot move outside the editor;
      return false;
    }
    return moveToNextElement($(t).parent());
  }
  do {
    const tag = next.prop('tagName');
    if (tag === 'INPUT') {
      moveFocusToStart(next);
      return true;
    } else if (tag === 'DIV') {
      if (next.find('input').length === 0) {
        next = findNext(next);
      } else {
        next = next.find('input').first();
        moveFocusToStart(next);
        return true;
      }
    } else if (tag === 'SPAN') {
      next = findNext(next);
    } else {
      return false;
    }
  } while (true);
}

export function moveToPrevElement(t): boolean {
  let elConsidered = $(t).prev();

  do {
    if (elConsidered.length === 0) {
      return moveToPrevElement($(t).parent());
    }
    const tag = elConsidered.prop('tagName');
    if (tag === 'INPUT') {
      moveFocusToEnd(elConsidered);
      return true;
    } else if (tag === 'DIV') {
      if (elConsidered.find('input').length === 0) {
        elConsidered = findPrev(elConsidered);
      } else {
        elConsidered = elConsidered.find('input').last();
        moveFocusToEnd(elConsidered);
        return true;
      }
    } else if (tag === 'SPAN') {
      elConsidered = findPrev(elConsidered);
    } else if (tag === 'BR') {
      elConsidered = elConsidered.prev();
    } else {
      // Perhaps we could play an error sound
      return false;
    }
  } while (true);
}

function findPrev(n) {
  if (n.prev() === undefined) {
    return undefined;
  } else {
    return n.prev();
  }
}

export function isAtEnd(element: any): boolean {
  const cursorPos = element.selectionStart;
  // @ts-ignore
  const length = $(element).val().length;
  return cursorPos === length;
}

export function isAtStart(element: any): boolean {
  const cursorPos = element.selectionStart;
  return cursorPos === 0;
}
