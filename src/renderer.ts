import {fixedCell, alternativesProviderForAbstractConcept} from "./cells";

const renderersByName = {};

export function registerRenderer(name: string, renderer: any) : void {
    renderersByName[name] = renderer;
}

export function getRegisteredRenderer(conceptName) {
    return renderersByName[conceptName];
}

export function renderModelNode(modelNode) {
    return getRenderer(modelNode)(modelNode);
}

function getDefaultRenderer(modelNode) {
    let abstractConcept = modelNode.isAbstract();
    let conceptName = modelNode.simpleConceptName();
    return (dataModel) => {
        if (abstractConcept) {
            return fixedCell("", ['default-cell-abstract'], alternativesProviderForAbstractConcept(modelNode));
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
