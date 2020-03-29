export const myAutoresizeOptions = { padding: 2, minWidth: 10, maxWidth: 800 };

export function installAutoresize() : void {
  // @ts-ignore
  $.fn.textWidth = function (_text, _font) {
    // get width of text with font.  usage: $("div").textWidth();
    let textToConsider = _text || this.val();
    if (textToConsider === '') {
      textToConsider = this[0].placeholder;
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
    // @ts-ignore
    $(this).css('width', Math.min(options.maxWidth, Math.max(options.minWidth, $(this).textWidth() + options.padding)));
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
