import { addClass, addToDataset, alternativesProviderForAbstractConcept, fixedCell } from './cells';
import { setKey, wrapMouseOutHandler, wrapMouseOverHandler } from './cells';
import { ModelNode } from '../datamodel/modelNode';
import { VNode } from 'snabbdom/vnode';
import { editorController } from './EditorController';

const renderersByName: { [key: string]: Renderer } = {};

export type Renderer = (modelNode: ModelNode) => VNode;

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

export function renderModelNode(modelNode: ModelNode): VNode {
  let res = setKey(
    addToDataset(
      addClass(getRenderer(modelNode)(modelNode), 'represent-node'),
      'node_represented',
      modelNode.idString(),
    ),
    modelNode.idString(),
  );
  res = wrapMouseOverHandler(res, (event: MouseEvent): boolean => {
    // @ts-ignore
    const nodeId: string = event.target.dataset.node_represented as string;
    if (nodeId != null) {
      editorController().setHoverNode({ regularId: nodeId });
    }
    return true;
  });
  res = wrapMouseOutHandler(res, (event: MouseEvent): boolean => {
    // @ts-ignore
    const nodeId: string = event.target.dataset.node_represented as string;
    if (nodeId != null) {
      editorController().setHoverNode(undefined);
    }
    return true;
  });
  return res;
}

export function getBasicDefaultRenderer(modelNode: ModelNode): Renderer {
  const abstractConcept = modelNode.isAbstract();
  return () => {
    if (abstractConcept) {
      return fixedCell(modelNode, '', ['default-cell-abstract'], alternativesProviderForAbstractConcept(modelNode));
    } else {
      const label = modelNode.alias || `[default ${modelNode.simpleConceptName()}]`;
      return fixedCell(modelNode, label, ['default-cell-concrete']);
    }
  };
}

type DefaultRendererProvider = (modelNode: ModelNode) => Renderer;
let defaultRendererProvider : DefaultRendererProvider = getBasicDefaultRenderer;

export function setDefaultRendererProvider(newDefaultRendererProvider : DefaultRendererProvider) {
  defaultRendererProvider = newDefaultRendererProvider;
}

function getRenderer(modelNode: ModelNode | undefined): Renderer {
  if (modelNode == null) {
    // it happens during node replacements
    return () => fixedCell(modelNode, 'null');
  }
  const conceptName = modelNode.conceptName();
  return getRegisteredRenderer(conceptName) || defaultRendererProvider(modelNode);
}
