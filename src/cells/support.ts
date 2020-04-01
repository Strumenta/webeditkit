import { getDatamodelRoot, ModelNode } from '../datamodel';
import { getWsCommunication } from '../wscommunication';
import { myAutoresizeOptions } from '../uiutils';
import { VNode } from 'snabbdom/vnode';
import { VNodeChildElement } from 'snabbdom/h';

const autocomplete = require('autocompleter');

export function alternativesProviderForAbstractConcept(modelNode: ModelNode) {
  return alternativesProviderForAddingChild(modelNode.parent(), modelNode.containmentName(), true);
}

export function alternativesProviderForAddingChild(
  modelNode: ModelNode,
  containmentName: string,
  replacing: boolean = false,
) {
  // we should get all the alternatives from the server
  return (alternativesUser: (alternatives: { label: any; execute: () => void }[]) => void) => {
    const ws = getWsCommunication(modelNode.modelName());
    ws.askAlternatives(modelNode, containmentName, (alternatives: any) => {
      const adder = (conceptName: string) => () => {
        if (replacing) {
          ws.setChild(modelNode, containmentName, conceptName);
        } else {
          ws.addChild(modelNode, containmentName, conceptName);
        }
      };
      const uiAlternatives = Array.from(
        $(alternatives).map((index, domElement) => {
          return { label: domElement.alias, execute: adder(domElement.conceptName) };
        }),
      );
      alternativesUser(uiAlternatives);
    });
  };
}

export function installAutocomplete(
  vnode: any,
  valuesProvider: (arg0: (suggestions: any) => void) => void,
  fixed: boolean,
) {
  const input = vnode.elm;
  autocomplete({
    input,
    minLength: 0,
    render: (item: any, currentValue: any) => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      div.textContent = item.label;
      return div;
    },
    fetch: (text: string, update: any) => {
      text = text.toLowerCase();
      valuesProvider((suggestions: any) => {
        if (!fixed) {
          suggestions = suggestions.filter((n: { label: string }) => n.label.toLowerCase().startsWith(text));
        }
        update(suggestions);
      });
    },
    onSelect: (item: any) => {
      item.execute();
    },
    customize: (_input: any, inputRect: any, container: any, maxHeight: any) => {
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
  const collectionIndex = Array.from(parents).findIndex(e => $(e).hasClass('represent-collection'));
  const parentsToConsider = Array.from(parents).slice(0, collectionIndex);
  const nodesToConsider = $(parentsToConsider).filter(function () {
    return $(this).hasClass('represent-node');
  });
  const lastNode = nodesToConsider[nodesToConsider.length - 1];

  const nodeId = $(lastNode).data('node_represented');
  const sibling = getDatamodelRoot(modelNode.rootName()).findNodeById(nodeId);
  sibling.insertNextSibling();
}

export function addAutoresize(vnode: VNode) : void {
  // @ts-ignore
  $(vnode.elm).autoresize(myAutoresizeOptions);
}

export function triggerResize(vnode: VNode) : void {
  // @ts-ignore
  $(vnode.elm).inputWidthUpdate(myAutoresizeOptions);
}

Object.defineProperty(Array.prototype, 'flat', {
  value: function(depth = Infinity) {
    return this.reduce(function (flat, toFlatten) {
      // @ts-ignore
      return flat.concat((Array.isArray(toFlatten) && (depth>1)) ? toFlatten.flat(depth-1) : toFlatten);
    }, []);
  }
});

export function flattenArray(value: any) : any[] {
  const originalArray : any[] = Array.from(value);
  // @ts-ignore
  return originalArray.flat();
}

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

export function map(originalArray: any, op: any): VNodeChildElement[] {
  return Array.from($(originalArray).map(op));
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

/**
 *
 * @param nodeIdStr
 */
export function focusOnNode(nodeIdStr: string, rootName: string) {
  const domRoot = $('#' + rootName);
  const found = domRoot.find('.represent-node').filter(function () {
    return $(this).data('node_represented') == nodeIdStr;
  });
  if (found.length == 0) {
    console.warn('node to focus on not found', nodeIdStr);
    return;
  } else if (found.length > 1) {
    console.warn('more than one representation of node to focus ofound', nodeIdStr);
  }
  const firstNodeFound = found[0];
  // @ts-ignore
  window.fnf = firstNodeFound;
  focusOnFirstInputOf(firstNodeFound);
}

function focusOnFirstInputOf(element): boolean {
  if (element.tagName === 'INPUT') {
    $(element).focus();
    return true;
  }
  for (let i = 0; i < element.children.length; i++) {
    const chRes = focusOnFirstInputOf(element.children[i]);
    if (chRes) {
      return chRes;
    }
  }
  return false;
}
