export const myAutoresizeOptions = { padding: 2, minWidth: 10, maxWidth: 800 };

export function installAutoresize(textWidthAlternativeCalculator?: (text: string) => number): void {
  // @ts-ignore
  $.fn.textWidth = function (_text: string, _font) {
    // get width of text with font.  usage: $("div").textWidth();
    let textToConsider = _text || (this.val() as string);
    if (textToConsider === '') {
      textToConsider = (this[0] as HTMLInputElement).placeholder;
    }
    if (textWidthAlternativeCalculator != null) {
      return textWidthAlternativeCalculator(textToConsider);
    }
    const fakeEl = $('<span>')
      .hide()
      .appendTo(document.body)
      .text(textToConsider)
      .css({
        font: _font || this.css('font'),
        whiteSpace: 'pre',
      });
    const width = fakeEl.width();
    fakeEl.remove();
    return width;
  };

  // @ts-ignore
  $.fn.inputWidthUpdate = function (options) {
    options = $.extend({ padding: 10, minWidth: 0, maxWidth: 10000 }, options || {});

    $(this).css(
      'width',
      Math.min(
        options.maxWidth,
        // @ts-ignore
        Math.max(options.minWidth, (($(this).textWidth() as number) + options.padding) as number),
      ),
    );
  };

  // @ts-ignore
  $.fn.autoresize = function (options) {
    // resizes elements based on content size.  usage: $('input').autoresize({padding:10,minWidth:0,maxWidth:100});
    $(this)
      .on('input', function () {
        // @ts-ignore
        $(this).inputWidthUpdate(options);
      })
      .trigger('input');
    return this;
  };
}

export function previous(el: Element | null, selector: string) {
  while (el) {
    el = el.previousElementSibling;
    if(el && el.matches(selector)) {
      return el;
    }
  }
  return null;
}

export function next(el: Element | null, selector: string) {
  while (el) {
    el = el.nextElementSibling;
    if(el && el.matches(selector)) {
      return el;
    }
  }
  return null;
}

export function triggerFocus(element: HTMLInputElement) {
  const eventType = "onfocusin" in element ? "focusin" : "focus";
  const bubbles = "onfocusin" in element;
  let event;

  if ("createEvent" in document) {
    event = document.createEvent("Event");
    event.initEvent(eventType, bubbles, true);
  } else if ("Event" in window) {
    event = new Event(eventType, {bubbles, cancelable: true});
  }

  element.focus();
  // @ts-ignore
  element.dispatchEvent(event);
}