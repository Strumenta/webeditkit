import {getDatamodelRoot, ModelNode} from './datamodel';

import h, { VNodeChildElement } from 'snabbdom/h'; // helper function for creating vnodes

import { renderModelNode } from './renderer';

import { myAutoresizeOptions } from './uiutils';

import { getWsCommunication, WsCommunication } from './wscommunication';

import {isAtEnd, isAtStart, moveToNextElement} from './navigation';
import {VNode} from "snabbdom/vnode";

const autocomplete = require('autocompleter');

export function alternativesProviderForAbstractConcept(modelNode: ModelNode) {
  return alternativesProviderForAddingChild(modelNode.parent(), modelNode.containmentName(), true);
}

function alternativesProviderForAddingChild(modelNode: ModelNode, containmentName: string, replacing: boolean = false) {
  // we should get all the alternatives from the server
  return (alternativesUser: (alternatives: { label: any; execute: () => void; }[]) => void) => {
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

function installAutocomplete(vnode: any, valuesProvider: (arg0: (suggestions: any) => void) => void, fixed: boolean) {
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

function handleSelfDeletion(element: any, modelNode: ModelNode) : void{
  if ($(element).closest(".represent-node").hasClass('deleting')) {
    modelNode.deleteMe();
  } else {
    $(element).closest(".represent-node").addClass('deleting');
  }
}

function handleAddingElement(element: any, modelNode: ModelNode) : void{
  const parents = $(element).parents();
  // @ts-ignore
  window.ps = parents;

  // First find the collection containing this node
  const collectionIndex = Array.from(parents).findIndex(function(e) { return $(e).hasClass('represent-collection'); } );
  const parentsToConsider = Array.from(parents).slice(0, collectionIndex);
  const nodesToConsider = $(parentsToConsider).filter(function(){return $(this).hasClass('represent-node');});
  const lastNode = nodesToConsider[nodesToConsider.length - 1];

  //let thisNode = $(element).closest('.represent-node');
  // TODO check the found collection belongs to the model we are considering
  //let collectionElement = thisNode.closest(".represent-collection");

  // @ts-ignore
  //window.ce = collectionElement;
  //let parentOfCollection = collectionElement.closest('.represent-node');
  // @ts-ignore
  //window.tn = thisNode;
  const nodeId = $(lastNode).data('node_represented');
  // @ts-ignore
  window.ni = nodeId;
  // @ts-ignore
  window.rn = modelNode.rootName();
  // @ts-ignore
  window.r = getDatamodelRoot(modelNode.rootName());
  const sibling = getDatamodelRoot(modelNode.rootName()).findNodeById(nodeId);
  // @ts-ignore
  window.s = sibling;
  //let relationName = collectionElement.data('relation_represented');
  // TODO find right index
  sibling.insertNextSibling();
  //
  // QUI TROVIAMO LA PRIMA COLLEZIONE. DOBBIAMO POI TROVARE IL PRIMO FIGLIO CHE RAPPRESENTI UN NODO
  // FRA NOI E LA COLLEZIONE, PARTENDO DALLA COLLEZIONE
};

export function editableCell(modelNode: ModelNode, propertyName: string, extraClasses: string[]) {
  const placeholder = '<no ' + propertyName + '>';
  if (modelNode === undefined) {
    throw new Error('modelNode should not be undefined');
  }
  extraClasses = extraClasses || [];
  let extraClassesStr = '';
  if (extraClasses.length > 0) {
    extraClassesStr = '.' + extraClasses.join('.');
  }
  const ws = getWsCommunication(modelNode.modelName());
  return h(
    'input.editable' + extraClassesStr,
    {
      props: {
        value: modelNode.property(propertyName),
        placeholder,
        required: true,
      },
      hook: { insert: addAutoresize, update: triggerResize },
      on: {
        keydown: (e: KeyboardEvent) => {
          if (isAtEnd(e.target) && e.key === 'ArrowRight') {
            moveToNextElement(e.target);
            e.preventDefault();
            return true;
          }
          if (isAtStart(e.target) && e.key === 'Backspace') {
            handleSelfDeletion(e.target, modelNode);
            return false;
          }
          return false;
        },
        keyup: (e: KeyboardEvent) => {
          ws.triggerChangeOnPropertyNode(modelNode, propertyName, $(e.target).val());
        },
      },
    },
    [],
  );
}

function addAutoresize(vnode: any) {
  // @ts-ignore
  $(vnode.elm).autoresize(myAutoresizeOptions);
}

function triggerResize(vnode: any) {
  // @ts-ignore
  $(vnode.elm).inputWidthUpdate(myAutoresizeOptions);
}

export function fixedCell(modelNode: ModelNode, text: string, extraClasses?: string[], alternativesProvider?: any,
                          deleter?: () => void, onEnter?: () => void) {
  extraClasses = extraClasses || [];
  let extraClassesStr = '';
  if (extraClasses.length > 0) {
    extraClassesStr = '.' + extraClasses.join('.');
  }
  return h(
    'input.fixed' + extraClassesStr,
    {
      props: { value: text },
      hook: {
        insert: (vnode: any) => {
          addAutoresize(vnode);
          if (alternativesProvider != null && alternativesProvider !== undefined) {
            installAutocomplete(vnode, alternativesProvider, true);
          }
        },
        update: triggerResize,
      },
      on: {
        keydown: (e: KeyboardEvent) => {
          if (e.key === 'ArrowRight') {
            moveToNextElement(e.target);
          } else if (e.key === 'Backspace') {
            if (deleter !== undefined) {
              deleter();
            } else {
              handleSelfDeletion(e.target, modelNode);
              e.preventDefault();
              return false;
            }
          } else if (e.key == 'Enter') {
            if (onEnter !== undefined) {
              onEnter();
            } else if (alternativesProvider === null){
              // We do not want to do this for cells with autocompletion
              handleAddingElement(e.target, modelNode);
              e.preventDefault();
              return false;
            }
          }
          e.preventDefault();
          return false;
        },
      },
    },
    [],
  );
}

export function referenceCell(
  modelNode: ModelNode,
  referenceName: string,
  extraClasses?: string[],
  alternativesProvider?: any,
  deleter?: any,
) {
  extraClasses = extraClasses || [];
  let extraClassesStr = '';
  if (extraClasses.length > 0) {
    extraClassesStr = '.' + extraClasses.join('.');
  }
  return h(
    'input.reference' + extraClassesStr,
    {
      props: { value: 'Loading...' },
      hook: {
        insert: (vnode: any) => {
          addAutoresize(vnode);
          if (alternativesProvider != null && alternativesProvider !== undefined) {
            installAutocomplete(vnode, alternativesProvider, true);
          }
          modelNode.ref(referenceName).loadData((refModelNode) => {
            $(vnode.elm).val(refModelNode.name());
            triggerResize(vnode);
          });
        },
        update: triggerResize,
      },
      on: {
        keydown: (e: KeyboardEvent) => {
          if (e.key === 'ArrowRight') {
            moveToNextElement(e.target);
          } else if (e.key === 'Backspace') {
            if (deleter !== undefined) {
              deleter();
            }
          }
          e.preventDefault();
          return false;
        },
      },
    },
    [],
  );
}

export function row() {
  return h('div.row', {}, flattenArray(arguments));
}

export function emptyRow() {
  return row();
}

export function tabCell() {
  return h('div.tab', {}, []);
}

function flattenArray(value: any) {
  // @ts-ignore
  return Array.from(value).flat();
}

export function addInsertHook(vnode: VNode, f: (VNode) => void) : VNode {
  if (vnode.data === undefined) {
    vnode.data = {};
  }
  if (vnode.data.hook === undefined) {
    vnode.data.hook = {};
  }
  vnode.data.hook.insert = f;
  return vnode;
}

export function addClass(vnode: VNode, className: string) : VNode{
  vnode.sel += '.' + className;
  return vnode;
}

export function setDataset(vnode: VNode, dataset: any) : VNode {
  vnode.data['dataset'] = dataset;
  return vnode;
}

export function addToDataset(vnode: VNode, key:string, value: any) : VNode {
  if (vnode.data['dataset'] === undefined) {
    vnode.data['dataset'] = {};
  };
  vnode.data['dataset'][key] = value;
  return vnode;
}

export function addId(vnode: VNode, myId: string) : VNode {
  let tagName = vnode.sel.split(/\.(.+)/)[0];
  let classes = vnode.sel.split(/\.(.+)/)[1];
  vnode.sel = tagName + "#" + myId;
  if (classes !== undefined) {
    vnode.sel += "." + classes;
  }
  return vnode;
}

export function childCell(modelNode: ModelNode, containmentName: string) {
  const child = modelNode.childByLinkName(containmentName);
  if (child == null) {
    // @ts-ignore
    return fixedCell(
        modelNode,
      '<no ' + containmentName + '>',
      ['missing-element'],
      alternativesProviderForAddingChild(modelNode, containmentName),
    );
  }
  return renderModelNode(child);
}

export function verticalCollectionCell(modelNode: ModelNode, containmentName: string, wrapInRows: boolean = true) {
  const ws = getWsCommunication(modelNode.modelName());
  const addInputChild = () => {
    // TODO FIXME
    ws.addChild(modelNode, containmentName, 'com.strumenta.financialcalc.Input');
  };
  const children = modelNode.childrenByLinkName(containmentName);
  const data = { dataset: { relation_represented: containmentName } };
  if (children.length === 0) {
    return h('div.vertical-collection.represent-collection', data, [
      fixedCell(modelNode, '<< ... >>', ['empty-collection'], (alternativesUser: any) => {
        alternativesUser([{ label: 'Input', execute: addInputChild }]);
      }, null, () => {
        ws.triggerDefaultInsertion(modelNode, containmentName);
      }),
    ]);
  } else {
    return h(
      'div.vertical-collection.represent-collection', data,
      map(modelNode.childrenByLinkName(containmentName), function () {
        if (wrapInRows) {
          // @ts-ignore
          return row(renderModelNode(this));
        } else {
          return renderModelNode(this);
        }
      }),
    );
  }
}

export function horizontalCollectionCell(modelNode: ModelNode, containmentName: string, separatorGenerator?: any) {
  const ws = getWsCommunication(modelNode.modelName());
  const addInputChild = () => {
    // TODO FIXME
    ws.addChild(modelNode, containmentName, 'com.strumenta.financialcalc.Input');
  };
  const children = modelNode.childrenByLinkName(containmentName);
  if (children.length === 0) {
    return h('div.horizontal-collection', {}, [
      fixedCell(modelNode, '<< ... >>', ['empty-collection'], (alternativesUser: any) => {
        alternativesUser([{ label: 'Input', execute: addInputChild }]);
      }),
    ]);
  } else {
    return h(
      'div.horizontal-collection',
      {},
      separate(
        map(modelNode.childrenByLinkName(containmentName), function () {
          // @ts-ignore
          return renderModelNode(this);
        }),
        separatorGenerator,
      ),
    );
  }
}

export function horizontalGroupCell() {
  return h('div.horizontal-group', {}, flattenArray(arguments));
}

export function verticalGroupCell() {
  return h('div.vertical-group', {}, flattenArray(arguments));
}

export function map(originalArray: any, op: any): VNodeChildElement[] {
  return Array.from($(originalArray).map(op));
}

function separate(original: any[], separatorGenerator?: any): any[] {
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
