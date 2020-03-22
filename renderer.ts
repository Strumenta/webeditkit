let cells = require('./cells');

let renderersByName = {};

function registerRenderer(name: string, renderer: any) {
    renderersByName[name] = renderer;
}

function getRegisteredRenderer(conceptName) {
    return renderersByName[conceptName];
}

function renderModelNode(modelNode) {
    return getRenderer(modelNode)(modelNode);
}

function getDefaultRenderer(modelNode) {
    let abstractConcept = modelNode.isAbstract();
    let conceptName = modelNode.simpleConceptName();
    return function (dataModel) {
        if (abstractConcept) {
            return cells.fixedCell("", ['default-cell-abstract'], cells.alternativesProviderForAbstractConcept(modelNode));
        } else {
            return cells.fixedCell("[default " + conceptName + "]", ['default-cell-concrete']);
        }
    };
}

function getRenderer(modelNode) {
    if (modelNode == null) {
        // it happens during node replacements
        return function() { return cells.fixedCell("null"); };
    }
    let abstractConcept = modelNode.isAbstract();
    let conceptName = modelNode.conceptName();
    return getRegisteredRenderer(conceptName) || getDefaultRenderer(modelNode);
}

module.exports.registerRenderer = registerRenderer;
module.exports.getRegisteredRenderer = getRegisteredRenderer;
module.exports.renderModelNode = renderModelNode;