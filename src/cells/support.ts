import { getDatamodelRoot, ModelNode } from '../datamodel';
import {Alternative, getWsCommunication} from '../wscommunication';
import { myAutoresizeOptions } from '../uiutils';
import { VNode } from 'snabbdom/vnode';
import { VNodeChildElement } from 'snabbdom/h';

const autocomplete = require('autocompleter');

import merge = require('lodash.merge');

export function alternativesProviderForAbstractConcept(modelNode: ModelNode) {
  const parent = modelNode.parent();
  if (parent == null) {
    throw new Error('The given node has no parent');
  }
  return alternativesProviderForAddingChild(parent, modelNode.containmentName(), true);
}

type SuggestionsReceiverFactory = (suggestionsReceiver: SuggestionsReceiver) => void;

export function alternativesProviderForAddingChild(
  modelNode: ModelNode,
  containmentName: string,
  replacing: boolean = false,
): SuggestionsReceiverFactory {
  if (modelNode == null) {
    throw new Error('modelNode should not be null');
  }
  // we should get all the alternatives from the server
  return (suggestionsReceiver: SuggestionsReceiver) => {
    const modelName = modelNode.modelName();
    if (modelName == null) {
      throw new Error('The received node has not model name');
    }
    const ws = getWsCommunication(modelName);
    if (ws == null) {
      throw new Error('No WsCommunication registered for model ' + modelNode.modelName());
    }
    ws.askAlternatives(modelNode, containmentName, (alternatives: any) => {
      const adder = (conceptName: string) => () => {
        if (replacing) {
          ws.setChild(modelNode, containmentName, conceptName);
        } else {
          ws.addChild(modelNode, containmentName, conceptName);
        }
      };
      const uiAlternatives = Array.from(
        $(alternatives).map((index, domElement: Alternative) => {
          return { label: domElement.alias, execute: adder(domElement.conceptName) };
        }),
      );
      suggestionsReceiver(uiAlternatives);
    });
  };
}

export interface AutocompleteAlternative {
  label: string;
  execute: () => void;
}

export type SuggestionsReceiver = (suggestions: AutocompleteAlternative[]) => void;

export function installAutocomplete(
  vnode: any,
  valuesProvider: (suggestionsReceiver: SuggestionsReceiver) => void,
  fixed: boolean,
) {
  const input = vnode.elm;
  const ac = autocomplete({
    input,
    minLength: 0,
    render: (item: any, currentValue: any) => {
      const div = document.createElement('div');
      if (item.highlighted) {
        div.className = 'autocomplete-item highlighted';
      } else {
        div.className = 'autocomplete-item';
      }
      div.textContent = item.label;
      return div;
    },
    fetch: (text: string, update: any) => {
      text = text.toLowerCase();
      valuesProvider((suggestions: AutocompleteAlternative[]) => {
        if (!fixed) {
          suggestions = suggestions.filter((n: { label: string }) => n.label.toLowerCase().startsWith(text));
        }
        update(suggestions);
      });
    },
    onSelect: (item: AutocompleteAlternative) => {
      item.execute();
    },
    customize: (_input: any, inputRect: any, container: any, maxHeight: any) => {
      // not true in tests
      $(container).css('width', 'auto');
    },
  });
}

export function handleSelfDeletion(element: any, modelNode: ModelNode): void {
  if ($(element).closest('.represent-node').hasClass('deleting')) {
    modelNode.deleteMe();
  } else {
    $(element).closest('.represent-node').addClass('deleting');
  }
}

export function handleAddingElement(element: any, modelNode: ModelNode): void {
  const parents = $(element).parents();

  // First find the collection containing this node
  const collectionIndex = Array.from(parents).findIndex((e) => $(e).hasClass('represent-collection'));
  const parentsToConsider = Array.from(parents).slice(0, collectionIndex);
  const nodesToConsider = $(parentsToConsider).filter(function () {
    return $(this).hasClass('represent-node');
  });
  const lastNode = nodesToConsider[nodesToConsider.length - 1];

  const nodeId = $(lastNode).data('node_represented');
  const sibling = getDatamodelRoot(modelNode.rootName()).findNodeById(nodeId);
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

export function addInsertHook(vnode: VNode, f: (VNode) => void): VNode {
  if (vnode.data === undefined) {
    vnode.data = {};
  }
  if (vnode.data.hook === undefined) {
    vnode.data.hook = {};
  }
  vnode.data.hook.insert = f;
  return vnode;
}

export function wrapKeydownHandler(vnode: VNode, keydownHandler: (event) => boolean): VNode {
  if (vnode.data === undefined) {
    vnode.data = {};
  }
  if (vnode.data.on === undefined) {
    vnode.data.on = {};
  }
  if (vnode.data.on.keydown === undefined) {
    vnode.data.on.keydown = keydownHandler;
  } else {
    const original = vnode.data.on.keydown;
    vnode.data.on.keydown = (event) => {
      const res = keydownHandler(event);
      if (res) {
        return original(event);
      } else {
        return res;
      }
    };
  }
  return vnode;
}

export function addClass(vnode: VNode, className: string): VNode {
  vnode.sel += '.' + className;
  return vnode;
}

export function setDataset(vnode: VNode, dataset: any): VNode {
  vnode.data.dataset = dataset;
  return vnode;
}

export function addToDataset(vnode: VNode, key: string, value: any): VNode {
  if (vnode.data.dataset === undefined) {
    vnode.data.dataset = {};
  }
  vnode.data.dataset[key] = value;
  return vnode;
}

export function addToDatasetObj(vnode: VNode, dataObj: object) {
  if (vnode.data.dataset === undefined) {
    vnode.data.dataset = {};
  }
  vnode.data.dataset = merge(vnode.data.dataset, dataObj);
  return vnode;
}

export function setKey(vnode: VNode, key: string): VNode {
  vnode.key = key;
  return vnode;
}

export function addId(vnode: VNode, myId: string): VNode {
  const tagName = vnode.sel.split(/\.(.+)/)[0];
  const classes = vnode.sel.split(/\.(.+)/)[1];
  vnode.sel = tagName + '#' + myId;
  if (classes !== undefined) {
    vnode.sel += '.' + classes;
  }
  return vnode;
}

export function map(originalArray: any, op: (el: any) => any): VNodeChildElement[] {
  return originalArray.map(op);
}

export function separate(original: any[], separatorGenerator?: any): any[] {
  if (separatorGenerator === undefined) {
    return original;
  }
  const separated = [];
  for (let i = 0; i < original.length; i++) {
    separated.push(original[i]);
    if (i + 1 < original.length) {
      separated.push(separatorGenerator());
    }
  }
  return separated;
}

export function focusOnReference(modelNode: ModelNode, referenceName: string) {
  const firstNodeFound = findDomElement(modelNode.idString(), modelNode.rootName());
  if (firstNodeFound != null) {
    const inputs = $(firstNodeFound).find('input');
    const refNode = inputs.filter((i,el)=>{
      return $(el).data('nodeRepresented') == modelNode.idString() && $(el).data('referenceRepresented') == referenceName;
    });
    if (refNode.length === 1) {
      refNode.focus();
    }
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
 */
export function focusOnNode(nodeIdStr: string, rootName: string) {
  const firstNodeFound = findDomElement(nodeIdStr, rootName);
  if (firstNodeFound != null) {
    focusOnFirstInputOf(firstNodeFound);
  }
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
