import {myAutoresizeOptions, triggerFocus} from '../uiutils';
import { VNode } from 'snabbdom/vnode';
import { VNodeChildElement } from 'snabbdom/h';
import { ModelNode } from '../../datamodel';

import { getDatamodelRoot } from '../../datamodel/registry';
import { log } from '../../utils/misc';
import _ from 'lodash';

export function handleSelfDeletion(element: HTMLElement, modelNode: ModelNode): void {
  const closest = element.closest('.represent-node');
  console.log(closest);
  if (closest?.classList.contains('deleting')) {
    modelNode.deleteMe();
  } else {
    closest?.classList.add('deleting');
  }
}

export function handleAddingElement(element: HTMLElement, modelNode: ModelNode): void {
  log('adding element', element, modelNode);
  const parent = element.parentElement;
  const nodeId = parent?.dataset.node_represented;
  if(!nodeId) {
    return;
  }

  const modelRootName = modelNode.rootName();
  if (modelRootName == null) {
    return;
  }

  const root = getDatamodelRoot(modelRootName);
  if (root == null) {
    return;
  }

  const sibling = root.findNodeById(nodeId);
  if (sibling == null) {
    return;
  }

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
  return originalArray.map(op) as VNodeChildElement[];
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

export function focusOnReference(modelNode: ModelNode, referenceName: string): void {
  const rootName = modelNode.rootName();
  if (rootName == null) {
    return;
  }
  const firstNodeFound = findDomElement(modelNode.idString(), rootName);
  if (firstNodeFound == null) {
    return;
  }

  const inputs = firstNodeFound.querySelectorAll('input');
  let refNode;
  if (firstNodeFound.dataset.node_represented === modelNode.idString() &&
      firstNodeFound.dataset.reference_represented === referenceName) {
    refNode = [firstNodeFound];
  } else {
     refNode = _.filter(inputs, (el, i) => {
      return (
        el.dataset.node_represented === modelNode.idString() &&
        el.dataset.reference_represented === referenceName
      );
    });
  }
  if (refNode.length === 1) {
    triggerFocus(refNode[0] as HTMLInputElement);
  }
}

export function findDomElement(nodeIdStr: string, rootName: string): HTMLElement | null {
  const domRoot = document.getElementById(rootName);
  if (!domRoot) {
    throw new Error(`Root with ID ${rootName} not found`);
  }
  const found = _.filter(domRoot.querySelectorAll('.represent-node'), (el) => {
    return el instanceof window.HTMLElement && el.dataset.node_represented === nodeIdStr;
  }) as HTMLElement[];
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
export function focusOnNode(nodeIdStr: string, rootName: string | undefined): void {
  if (rootName == null) {
    return;
  }
  const firstNodeFound = findDomElement(nodeIdStr, rootName);
  if (firstNodeFound == null) {
    return;
  }

  focusOnFirstInputOf(firstNodeFound);
}

function focusOnFirstInputOf(element: HTMLElement): boolean {
  if (element.tagName === 'INPUT') {
    triggerFocus(element as HTMLInputElement);
    return true;
  }

  for (const chRes of element.children) {
    if (focusOnFirstInputOf(chRes as HTMLElement)) {
      return true;
    }
  }
  return false;
}

export function isEditorElement(element: HTMLElement): boolean {
  return element.classList.contains('editor');
}

export function domElementToModelNode(element: HTMLElement): ModelNode | undefined {
  if (isEditorElement(element)) {
    return undefined;
  }
  log('domElementToModelNode', element);
  log('  data', element.dataset.node_represented);
  const nodeId = element.dataset.node_represented;
  if (nodeId != null && nodeId !== '') {
    const modelLocalName = (element.closest('.editor') as HTMLElement)?.dataset.model_local_name as string;
    log('  model local name', modelLocalName);
    const dataModelRoot = getDatamodelRoot(modelLocalName);
    return dataModelRoot?.findNodeById(nodeId);
  } else if (element.parentElement != null) {
    return domElementToModelNode(element.parentElement);
  } else {
    return undefined;
  }
}
