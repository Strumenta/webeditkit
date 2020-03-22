myAutoresizeOptions = {padding:2,minWidth:10,maxWidth:800};

function installAutoresize() {
    $.fn.textWidth = function(_text, _font){//get width of text with font.  usage: $("div").textWidth();
        var textToConsider = _text || this.val();
        if (textToConsider == "") {
            //console.log("NO TEXT "+ this[0].placeholder);
            textToConsider = this[0].placeholder;
        }
        var fakeEl = $('<span>').hide().appendTo(document.body).text(textToConsider).css({font: _font || this.css('font'), whiteSpace: "pre"}),
            width = fakeEl.width();
        fakeEl.remove();
        return width;
    };

    $.fn.inputWidthUpdate = function(options) {
        //console.log("INPUT CALLED");
        options = $.extend({padding:10,minWidth:0,maxWidth:10000}, options||{});
        $(this).css('width', Math.min(options.maxWidth,Math.max(options.minWidth,$(this).textWidth() + options.padding)));
    };

    $.fn.autoresize = function(options){//resizes elements based on content size.  usage: $('input').autoresize({padding:10,minWidth:0,maxWidth:100});
        $(this).on('input', function() {
            $(this).inputWidthUpdate(options);
            //console.log("INPUT CALLED");
            //$(this).css('width', Math.min(options.maxWidth,Math.max(options.minWidth,$(this).textWidth() + options.padding)));
        }).trigger('input');
        return this;
    };
}

module.exports.installAutoresize = installAutoresize;
module.exports.myAutoresizeOptions = myAutoresizeOptions;