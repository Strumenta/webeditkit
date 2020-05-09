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
  const candidate = n.next();
  if (candidate == null || candidate.length == 0) {
    const p = $(n).parent();
    if (p == null || $(p).hasClass('editor')) {
      return null;
    } else {
      return findNext(p);
    }
  } else {
    return candidate;
  }
}

function findPrev(n) {
  const candidate = n.prev();
  if (candidate == null || candidate.length == 0) {
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

function selectFirstElementInRow(row, focusOnEnd) {
  console.log('selectFirstElementInRow', row);
  // @ts-ignore
  window.sf = row;
  if ($(row).children('input').length > 0) {
    $($(row).children('input')[0]).focus();
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
      for (let i = 0; i < children.length; i++) {
        if ($(children[i]).find('input').length > 0) {
          // there is an input somewhere here, we should dive into this
          return selectFirstElementInRow(children[i], focusOnEnd);
        }
      }
    }
    throw new Error('This should not happen');
  }
}

export function moveUp(t) {
  if ($(t).hasClass('editor')) {
    return;
  }
  console.log('move up');
  // @ts-ignore
  window.mu = t;
  // @ts-ignore
  const l = $(t).closest('.row,.vertical-collection');
  if (l.length === 0) {
    console.warn('no line found');
  } else if (l.length > 1) {
    console.warn('too many lines found');
  } else {
    console.log('element found');
    const currentLine = l;
    let nextLine = currentLine;
    do {
      console.log(' before', nextLine);
      nextLine = $(nextLine).prev('.row,.vertical-collection');
      console.log(' after', nextLine);
    } while (nextLine.length == 1 && $(nextLine).find('input').length == 0);
    if (nextLine.length == 1) {
      selectFirstElementInRow(nextLine[0], true);
    } else {
      moveUp(t.parentElement);
    }
    // We must find the previous line and pick the first element there
  }
}

export function moveDown(t) {
  if ($(t).hasClass('editor')) {
    return;
  }
  console.log('move down', t);
  // @ts-ignore
  window.mu = t;
  // @ts-ignore
  const l = $(t).closest('.row,.vertical-collection');
  if (l.length === 0) {
    console.warn('no line found');
  } else if (l.length > 1) {
    console.warn('too many lines found');
  } else {
    console.log('element found');
    const currentLine = l;
    let nextLine = currentLine;
    do {
      console.log(' before', nextLine);
      nextLine = $(nextLine).next('.row,.vertical-collection');
      console.log(' after', nextLine);
    } while (nextLine.length == 1 && $(nextLine).find('input').length == 0);
    if (nextLine.length == 1) {
      selectFirstElementInRow(nextLine[0], false);
      //const firstInput = $(nextLine).find("input");
      //$(firstInput).focus();
    } else {
      moveDown(t.parentElement);
    }
    // We must find the previous line and pick the first element there
  }
}

export function moveToNextElement(t): boolean {
  let elConsidered = findNext($(t));
  while (elConsidered != null) {
    const tag = elConsidered.prop('tagName');
    if (tag === 'INPUT') {
      moveFocusToStart(elConsidered);
      return true;
    } else if (tag === 'DIV' || tag === 'SPAN') {
      if (elConsidered.find('input').length === 0) {
        elConsidered = findNext(elConsidered);
      } else {
        elConsidered = elConsidered.find('input').first();
        moveFocusToStart(elConsidered);
        return true;
      }
    } else {
      // Perhaps we could play an error sound
      return false;
    }
  }
  return false;
}

export function moveToPrevElement(t): boolean {
  let elConsidered = findPrev($(t));
  while (elConsidered != null) {
    const tag = elConsidered.prop('tagName');
    if (tag === 'INPUT') {
      moveFocusToEnd(elConsidered);
      return true;
    } else if (tag === 'DIV' || tag === 'SPAN') {
      if (elConsidered.find('input').length === 0) {
        elConsidered = findPrev(elConsidered);
      } else {
        elConsidered = elConsidered.find('input').last();
        moveFocusToEnd(elConsidered);
        return true;
      }
    } else {
      // Perhaps we could play an error sound
      return false;
    }
  }
  return false;
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
