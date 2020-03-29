import { fixedCell } from './cells';
import { alternativesProviderForAbstractConcept, addClass, addToDataset } from './cells';
import { setKey } from './cells/support';
import {ModelNode} from "./datamodel";
import {VNode} from "snabbdom/vnode";

const renderersByName : {[key:string]: Renderer}= {};

type Renderer = (modelNode:ModelNode) => VNode;

export function clearRendererRegistry() : void {
  Object.keys(renderersByName).forEach(function(key) { delete renderersByName[key]; });
}

export function registerRenderer(name: string, renderer: Renderer): void {
  renderersByName[name] = renderer;
}

export function getRegisteredRenderer(conceptName: string) : Renderer | undefined {
  return renderersByName[conceptName];
}

export function renderModelNode(modelNode) : VNode {
  return setKey(
    addToDataset(
      addClass(getRenderer(modelNode)(modelNode), 'represent-node'),
      'node_represented',
      modelNode.idString(),
    ),
    modelNode.idString(),
  );
}

function getDefaultRenderer(modelNode) : Renderer {
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

function getRenderer(modelNode) : Renderer {
  if (modelNode == null) {
    // it happens during node replacements
    return () => fixedCell(modelNode, 'null');
  }
  const conceptName = modelNode.conceptName();
  return getRegisteredRenderer(conceptName) || getDefaultRenderer(modelNode);
}
