let renderers = {};

function registerRenderer(name, renderer) {
    if (renderers == undefined) {
        renderers = {};
    }
    renderers[name] = renderer;
}

function getRegisteredRenderer(conceptName) {
    return renderers[conceptName];
}

module.exports.registerRenderer = registerRenderer;
module.exports.getRegisteredRenderer = getRegisteredRenderer;