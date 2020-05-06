import { addClass, addToDataset, alternativesProviderForAbstractConcept, fixedCell } from './cells';
import { setKey, wrapMouseOutHandler, wrapMouseOverHandler } from './cells';
import { ModelNode } from '../datamodel/modelNode';
import { VNode } from 'snabbdom/vnode';
import {editorController} from "./EditorController";

const renderersByName: { [key: string]: Renderer } = {};

type Renderer = (modelNode: ModelNode) => VNode;

export function clearRendererRegistry(): void {
  Object.keys(renderersByName).forEach((key) => {
    delete renderersByName[key];
  });
}

export function registerRenderer(name: string, renderer: Renderer): void {
  renderersByName[name] = renderer;
}

export function getRegisteredRenderer(conceptName: string): Renderer | undefined {
  return renderersByName[conceptName];
}

export function renderModelNode(modelNode): VNode {
  if (modelNode == null) {
    throw new Error('renderModelNode invoked with null modelNode');
  }
  let res = setKey(
      addToDataset(
          addClass(getRenderer(modelNode)(modelNode), 'represent-node'),
          'node_represented',
          modelNode.idString(),
      ),
      modelNode.idString(),
  );
  res = wrapMouseOverHandler(res, (event: MouseEvent) : boolean => {
    // @ts-ignore
    const nodeId : string = event.target.dataset.node_represented;
    if (nodeId != null) {
      editorController().setHoverNode({regularId: nodeId});
    }
    return true; });
  res = wrapMouseOutHandler(res, (event: MouseEvent) : boolean => {
    // @ts-ignore
    const nodeId : string = event.target.dataset.node_represented;
    if (nodeId != null) {
      editorController().setHoverNode(undefined);
    }
    return true; });
  return res;
}

function getDefaultRenderer(modelNode): Renderer {
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

function getRenderer(modelNode): Renderer {
  if (modelNode == null) {
    // it happens during node replacements
    return () => fixedCell(modelNode, 'null');
  }
  const conceptName = modelNode.conceptName();
  return getRegisteredRenderer(conceptName) || getDefaultRenderer(modelNode);
}
