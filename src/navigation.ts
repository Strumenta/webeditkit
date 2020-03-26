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

export function moveToNextElement(t) {
  let next = $(t).next();
  if (next.length === 0) {
    const parent = $(t).parent();
    if (parent.hasClass('editor')) {
      // cannot move outside the editor;
      return false;
    }
    moveToNextElement($(t).parent());
    return;
  }
  do {
    const tag = next.prop('tagName');
    if (tag === 'INPUT') {
      moveFocusToStart(next);
      return;
    } else if (tag === 'DIV') {
      if (next.find('input').length === 0) {
        next = findNext(next);
      } else {
        next = next.find('input').first();
        moveFocusToStart(next);
        return;
      }
    } else if (tag === 'SPAN') {
      next = findNext(next);
    } else {
      return;
    }
  } while (true);
}

export function moveToPrevElement(t) {
  let elConsidered = $(t).prev();

  do {
    if (elConsidered.length === 0) {
      moveToPrevElement($(t).parent());
      return;
    }
    const tag = elConsidered.prop('tagName');
    if (tag === 'INPUT') {
      moveFocusToEnd(elConsidered);
      return;
    } else if (tag === 'DIV') {
      if (elConsidered.find('input').length === 0) {
        elConsidered = findPrev(elConsidered);
      } else {
        elConsidered = elConsidered.find('input').last();
        moveFocusToEnd(elConsidered);
        return;
      }
    } else if (tag === 'SPAN') {
      elConsidered = findPrev(elConsidered);
    } else if (tag === 'BR') {
      elConsidered = elConsidered.prev();
    } else {
      // Perhaps we could play an error sound
      return;
    }
  } while (true);
}

function findPrev(n) {
  console.log('PREV WAS ' + n[0]);
  if (n.prev() === undefined) {
    return undefined;
  } else {
    return n.prev();
  }
}

export function isAtEnd(element: any) {
  const cursorPos = element.selectionStart;
  // @ts-ignore
  const length = $(element).val().length;
  return cursorPos === length;
}
