export const myAutoresizeOptions = { padding: 2, minWidth: 10, maxWidth: 800 };

function textWidth(elOrText?: HTMLElement | string, options: InputWidthOptions = {}): number {
  // get width of text with font.
  const element = elOrText as any;
  let textToConsider = typeof elOrText === 'string' ? elOrText : (element.value as string);
  if (textToConsider === '' && elOrText instanceof window.HTMLInputElement) {
    textToConsider = elOrText.placeholder;
  }
  const padding = options.padding || 0;
  if (options.widthCalculator) {
    return options.widthCalculator(textToConsider) + padding;
  }
  if (!document.body) {
    return 0;
  }
  const fakeEl = document.createElement('span');
  if (element.style) {
    const style = document.defaultView?.getComputedStyle(element);
    if (style) {
      fakeEl.style.font = style.font;
      fakeEl.style.fontFamily = style.fontFamily;
      fakeEl.style.fontSize = style.fontSize;
    }
  }
  fakeEl.style.visibility = 'hidden';
  fakeEl.style.whiteSpace = 'pre';
  if (options.style) {
    // tslint:disable-next-line:forin
    for (const p in options.style) {
      // @ts-ignore
      fakeEl.style[p] = options.style[p];
    }
  }
  fakeEl.innerText = textToConsider;
  document.body.appendChild(fakeEl);
  const width = fakeEl.getBoundingClientRect().width;
  fakeEl.remove();
  return width + padding;
}

export type InputWidthOptions = {
  padding?: number;
  minWidth?: number;
  maxWidth?: number;
  widthCalculator?: (text: string) => number;
  style?: { [property: string]: string };
};
export function inputWidthUpdate(el: HTMLElement, options?: InputWidthOptions): void {
  options = { ...{ padding: 10, minWidth: 0, maxWidth: 10000 }, ...(options || {}) };

  el.style.width = `${Math.min(
    options.maxWidth || 0,
    // @ts-ignore
    Math.max(options.minWidth, textWidth(el, options)),
  )}px`;
}

export function autoresize(el: HTMLElement, options?: InputWidthOptions) {
  // resizes elements based on content size.  usage: autoresize(someInput, {padding:10,minWidth:0,maxWidth:100});
  const eventType = 'input';
  const previousListener = (el as any).__autoresizeListener;
  if (previousListener) {
    el.removeEventListener(eventType, previousListener);
  }
  const listener = () => {
    inputWidthUpdate(el, options);
  };
  el.addEventListener(eventType, listener);
  inputWidthUpdate(el, options);
  (el as any).__autoresizeListener = listener;
  return el;
}

export function previous(el: Element | null, selector: string) {
  while (el) {
    el = el.previousElementSibling;
    if (el && el.matches(selector)) {
      return el;
    }
  }
  return null;
}

export function next(el: Element | null, selector: string) {
  while (el) {
    el = el.nextElementSibling;
    if (el && el.matches(selector)) {
      return el;
    }
  }
  return null;
}

function createEvent(eventType: string, bubbles = false, cancelable = true) {
  let event;
  if ('createEvent' in document) {
    event = document.createEvent('Event');
    event.initEvent(eventType, bubbles, cancelable);
  } else if ('Event' in window) {
    event = new window.Event(eventType, { bubbles, cancelable });
  }
  return event;
}

export function triggerFocus(element: HTMLInputElement) {
  const eventType = 'onfocusin' in element ? 'focusin' : 'focus';
  const bubbles = 'onfocusin' in element;
  const event = createEvent(eventType, bubbles);

  element.focus();
  // @ts-ignore
  element.dispatchEvent(event);
}
