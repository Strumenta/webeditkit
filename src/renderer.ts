import { fixedCell } from './cells';
import { alternativesProviderForAbstractConcept, addClass, addToDataset } from './cells';
import {setKey} from "./cells/support";

const renderersByName = {};

export function registerRenderer(name: string, renderer: any): void {
  renderersByName[name] = renderer;
}

export function getRegisteredRenderer(conceptName) {
  return renderersByName[conceptName];
}

export function renderModelNode(modelNode) {
  return setKey(addToDataset(
    addClass(getRenderer(modelNode)(modelNode), 'represent-node'),
    'node_represented',
    modelNode.idString(),
  ), modelNode.idString());
}

function getDefaultRenderer(modelNode) {
  const abstractConcept = modelNode.isAbstract();
  const conceptName = modelNode.simpleConceptName();
  return (dataModel) => {
    if (abstractConcept) {
      return fixedCell(modelNode, '', ['default-cell-abstract'], alternativesProviderForAbstractConcept(modelNode));
    } else {
      return fixedCell(modelNode, '[default ' + conceptName + ']', ['default-cell-concrete']);
    }
  };
}

function getRenderer(modelNode) {
  if (modelNode == null) {
    // it happens during node replacements
    return () => fixedCell(modelNode, 'null');
  }
  const conceptName = modelNode.conceptName();
  return getRegisteredRenderer(conceptName) || getDefaultRenderer(modelNode);
}
