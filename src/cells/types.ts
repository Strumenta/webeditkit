import h, { VNodeChildElement } from 'snabbdom/h';
import { getWsCommunication } from '../wscommunication';
import { isAtEnd, isAtStart, moveToNextElement, moveToPrevElement } from '../navigation';
import {
  addAutoresize,
  alternativesProviderForAddingChild,
  flattenArray,
  handleAddingElement,
  handleSelfDeletion,
  installAutocomplete,
  separate,
  triggerResize,
  map,
  focusOnNode, SuggestionsReceiver,
} from './support';
import { ModelNode, NodeId, nodeIdToString } from '../datamodel';
import { renderModelNode } from '../renderer';
import {VNode} from "snabbdom/vnode";

export function childCell(modelNode: ModelNode, containmentName: string) : VNode  {
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

export function verticalCollectionCell(modelNode: ModelNode, containmentName: string, wrapInRows: boolean = true) : VNode  {
  const ws = getWsCommunication(modelNode.modelName());
  const children = modelNode.childrenByLinkName(containmentName);
  const data = { dataset: { relation_represented: containmentName } };
  if (children.length === 0) {
    return h('div.vertical-collection.represent-collection', data, [
      fixedCell(
        modelNode,
        '<< ... >>',
        ['empty-collection'],
        alternativesProviderForAddingChild(modelNode, containmentName),
        null,
        () => {
          console.log('on enter');
          ws.triggerDefaultInsertion(modelNode, containmentName, (addedNodeID: NodeId) => {
            console.log('reactorToInsertion', addedNodeID);
            const nodeIdStr = nodeIdToString(addedNodeID);
            console.log('reactorToInsertion', nodeIdStr);
            focusOnNode(nodeIdStr, modelNode.rootName());
          });
        },
      ),
    ]);
  } else {
    return h(
      'div.vertical-collection.represent-collection',
      data,
      map(modelNode.childrenByLinkName(containmentName), function (el) {
        if (wrapInRows) {
          return row(renderModelNode(el));
        } else {
          return renderModelNode(el);
        }
      }),
    );
  }
}

export function horizontalCollectionCell(modelNode: ModelNode, containmentName: string, separatorGenerator?: any) : VNode  {
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
        map(modelNode.childrenByLinkName(containmentName), (el: any) => {
          if (el == null) {
            throw new Error('null value receiving while mapping on childrenByLinkName(' + containmentName + ')')
          }
          return renderModelNode(el);
        }),
        separatorGenerator,
      ),
    );
  }
}

export function horizontalGroupCell() : VNode {
  return h('div.horizontal-group', {}, flattenArray(arguments));
}

export function verticalGroupCell(): VNode {
  return h('div.vertical-group', {}, flattenArray(arguments));
}

/**
 * @param modelNode
 * @param propertyName
 * @param extraClasses deprecated, use addClass instead
 */
export function editableCell(modelNode: ModelNode, propertyName: string, extraClasses: string[] = []) : VNode {
  if (modelNode == null) {
    throw new Error('modelNode should not be null');
  }
  const placeholder = '<no ' + propertyName + '>';
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
        value: modelNode.property(propertyName) || '',
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
          if (isAtStart(e.target) && e.key === 'ArrowLeft') {
            moveToPrevElement(e.target);
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
          ws.triggerChangeOnPropertyNode(modelNode, propertyName, $(e.target).val() as string);
        },
      },
    },
    [],
  );
}

export function fixedCell(
  modelNode: ModelNode,
  text: string,
  extraClasses?: string[],
  alternativesProvider?: any,
  deleter?: () => void,
  onEnter?: () => void,
) : VNode {
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
          if (alternativesProvider != null) {
            installAutocomplete(vnode, alternativesProvider, true);
          }
        },
        update: triggerResize,
      },
      on: {
        click: (e: MouseEvent) => {
          // @ts-ignore
          e.target.setSelectionRange(0, 0);
        },
        focus: (e: FocusEvent) => {
          // @ts-ignore
          e.target.setSelectionRange(0, 0);
        },
        keydown: (e: KeyboardEvent) => {
          if (e.key === 'ArrowRight') {
            moveToNextElement(e.target);
          } else if (e.key === 'ArrowLeft') {
            moveToPrevElement(e.target);
          } else if (e.key === 'Backspace') {
            if (deleter !== undefined) {
              deleter();
            } else {
              handleSelfDeletion(e.target, modelNode);
              e.preventDefault();
              return false;
            }
          } else if (e.key === 'Enter') {
            if ($('.autocomplete').length == 0) {
              if (onEnter !== undefined) {
                onEnter();
                e.preventDefault();
                return false;
              } else if (alternativesProvider === undefined) {
                // We should stop this when the autocomplete is displayed

                // We do not want to do this for cells with autocompletion
                handleAddingElement(e.target, modelNode);
                e.preventDefault();
                return false;
              }
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

export type AlternativesProvider = (suggestionsReceiver: SuggestionsReceiver) => void;

export function referenceCell(
  modelNode: ModelNode,
  referenceName: string,
  extraClasses?: string[],
  alternativesProvider?: AlternativesProvider,
  deleter?: any,
) : VNode {
  extraClasses = extraClasses || [];
  let extraClassesStr = '';
  if (extraClasses.length > 0) {
    extraClassesStr = '.' + extraClasses.join('.');
  }
  if (modelNode.ref(referenceName) == null) {
    return fixedCell(modelNode, `<no ${referenceName}>`, ['empty-reference'], alternativesProvider);
  }
  return h(
    'input.reference' + extraClassesStr,
    {
      props: { value: 'Loading...' },
      hook: {
        insert: (vnode: any) => {
          addAutoresize(vnode);
          if (alternativesProvider != null) {
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

export function row(...elements: any[]) : VNode {
  return h('div.row', {}, flattenArray(arguments));
}

export function emptyRow() : VNode {
  return row();
}

export function tabCell() : VNode {
  return h('div.tab', {}, []);
}
