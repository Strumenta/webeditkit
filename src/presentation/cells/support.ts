import { myAutoresizeOptions } from '../uiutils';
import { VNode } from 'snabbdom/vnode';
import { VNodeChildElement } from 'snabbdom/h';
import { ModelNode } from '../../datamodel/modelNode';

import { getDatamodelRoot } from '../../datamodel/registry';
import { log } from '../../utils/misc';

export function handleSelfDeletion(element: any, modelNode: ModelNode): void {
  if ($(element).closest('.represent-node').hasClass('deleting')) {
    modelNode.deleteMe();
  } else {
    $(element).closest('.represent-node').addClass('deleting');
  }
}

export function handleAddingElement(element: any, modelNode: ModelNode): void {
  log('adding element', element, modelNode);
  const parents = $(element).parents();

  // First find the collection containing this node
  const parentsArray = Array.from(parents);
  const collectionIndex = parentsArray.findIndex((e) => $(e).hasClass('represent-collection'));
  const parentsToConsider = parentsArray.slice(0, collectionIndex);
  const nodesToConsider = $(parentsToConsider).filter('.represent-node');
  const lastNode = nodesToConsider.last();

  const nodeId = lastNode.data('node_represented');
  const modelRootName = modelNode.rootName();
  if (modelRootName == null) { return; }

  const root = getDatamodelRoot(modelRootName);
  if (root == null) { return; }

  const sibling = root.findNodeById(nodeId);
  if (sibling == null) { return; }

  sibling.insertNextSibling();
}

export function addAutoresize(vnode: VNode): void {
  // @ts-ignore
  $(vnode.elm).autoresize(myAutoresizeOptions);
}

export function triggerResize(vnode: VNode): void {
  // @ts-ignore
  $(vnode.elm).inputWidthUpdate(myAutoresizeOptions);
}

export function flattenArray(value: any): any[] {
  const originalArray: any[] = Array.from(value);
  return flatten(originalArray);
}

const flatten = (arr: any[], result: any[] = []): any[] => {
  for (let i = 0, length = arr.length; i < length; i++) {
    const value = arr[i];
    if (Array.isArray(value)) {
      flatten(value, result);
    } else {
      result.push(value);
    }
  }
  return result;
};

export function map(originalArray: any, op: (el: any) => any): VNodeChildElement[] {
  return originalArray.map(op);
}

export function separate(original: any[], separatorGenerator?: () => VNode): any[] {
  if (separatorGenerator === undefined) {
    return original;
  }
  const separated: any[] = [];
  for (let i = 0; i < original.length; i++) {
    separated.push(original[i]);
    if (i + 1 < original.length) {
      separated.push(separatorGenerator());
    }
  }
  return separated;
}

export function focusOnReference(modelNode: ModelNode, referenceName: string) {
  const rootName = modelNode.rootName();
  if (rootName == null) {
    return;
  }
  const firstNodeFound = findDomElement(modelNode.idString(), rootName);
  if (firstNodeFound == null) {
    return;
  }

  const inputs = $(firstNodeFound).find('input');
  let refNode;
  if (
    $(firstNodeFound).data('node_represented') === modelNode.idString() &&
    $(firstNodeFound).data('reference_represented') === referenceName
  ) {
    refNode = $(firstNodeFound);
  } else {
    refNode = inputs.filter((i, el) => {
      return (
        $(el).data('node_represented') === modelNode.idString() && $(el).data('reference_represented') === referenceName
      );
    });
  }
  if (refNode.length === 1) {
    refNode.focus();
  }
}

export function findDomElement(nodeIdStr: string, rootName: string) {
  const domRoot = $('#' + rootName);
  if (domRoot.length === 0) {
    throw new Error(`Root with ID ${rootName} not found`);
  }
  const found = domRoot.find('.represent-node').filter(function () {
    return $(this).data('node_represented') === nodeIdStr;
  });
  if (found.length === 0) {
    return null;
  } else if (found.length > 1) {
    console.warn('more than one representation of node to focus found', nodeIdStr);
    return null;
  }
  return found[0];
}

/**
 *
 * @param nodeIdStr
 * @param rootName
 */
export function focusOnNode(nodeIdStr: string, rootName: string | undefined) {
  if (rootName == null) {
    return;
  }
  const firstNodeFound = findDomElement(nodeIdStr, rootName);
  if (firstNodeFound == null) {
    return;
  }

  focusOnFirstInputOf(firstNodeFound);
}

function focusOnFirstInputOf(element): boolean {
  if (element.tagName === 'INPUT') {
    $(element).focus();
    return true;
  }
  for (const chRes of element.children) {
    if (chRes) {
      return chRes;
    }
  }
  return false;
}

export function isEditorElement(element: HTMLElement): boolean {
  return $(element).hasClass('editor');
}

export function domElementToModelNode(element: HTMLElement): ModelNode | undefined {
  if (isEditorElement(element)) {
    return undefined;
  }
  log('domElementToModelNode', element);
  log('  data', $(element).data('node_represented'));
  const nodeId = $(element).data('node_represented');
  if (nodeId != null && nodeId !== '') {
    const modelLocalName = $(element).closest('.editor').data('model_local_name');
    log('  model local name', modelLocalName);
    const dataModelRoot = getDatamodelRoot(modelLocalName);
    return dataModelRoot?.findNodeById(nodeId);
  } else if (element.parentElement != null) {
    return domElementToModelNode(element.parentElement);
  } else {
    return undefined;
  }
}
