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

function renderModelNode(modelNode) {
    return getRenderer(modelNode)(modelNode);
}

function getDefaultRenderer(modelNode) {
    let abstractConcept = modelNode.isAbstract();
    let conceptName = modelNode.simpleConceptName();
    return function (dataModel) {
        if (abstractConcept) {
            return fixedCell("", ['default-cell-abstract'], alternativesProvider(modelNode));
        } else {
            return fixedCell("[default " + conceptName + "]", ['default-cell-concrete']);
        }
    };
}

function getRenderer(modelNode) {
    if (modelNode == null) {
        // it happens during node replacements
        return function() { return fixedCell("null"); };
    }
    let abstractConcept = modelNode.isAbstract();
    let conceptName = modelNode.conceptName();
    return getRegisteredRenderer(conceptName) || getDefaultRenderer(modelNode);
}

module.exports.registerRenderer = registerRenderer;
module.exports.getRegisteredRenderer = getRegisteredRenderer;
module.exports.renderModelNode = renderModelNode;