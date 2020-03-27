import {fixedCell, alternativesProviderForAbstractConcept, addClass, addToDataset} from './cells';

const renderersByName = {};

export function registerRenderer(name: string, renderer: any): void {
  renderersByName[name] = renderer;
}

export function getRegisteredRenderer(conceptName) {
  return renderersByName[conceptName];
}

export function renderModelNode(modelNode) {
  return addToDataset(addClass(getRenderer(modelNode)(modelNode), 'represent-node'), 'node_represented', modelNode.idString());
}

function getDefaultRenderer(modelNode) {
  const abstractConcept = modelNode.isAbstract();
  const conceptName = modelNode.simpleConceptName();
  return (dataModel) => {
    if (abstractConcept) {
      return fixedCell('', ['default-cell-abstract'], alternativesProviderForAbstractConcept(modelNode));
    } else {
      return fixedCell('[default ' + conceptName + ']', ['default-cell-concrete']);
    }
  };
}

function getRenderer(modelNode) {
  if (modelNode == null) {
    // it happens during node replacements
    return () => fixedCell('null');
  }
  const conceptName = modelNode.conceptName();
  return getRegisteredRenderer(conceptName) || getDefaultRenderer(modelNode);
}
