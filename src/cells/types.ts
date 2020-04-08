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
  focusOnNode,
  SuggestionsReceiver, wrapKeydownHandler,
} from './support';
import { ModelNode, NodeId, nodeIdToString, Ref } from '../datamodel';
import { renderModelNode } from '../renderer';
import { VNode } from 'snabbdom/vnode';
import {renderDataModels} from "../index";

export function childCell(modelNode: ModelNode, containmentName: string): VNode {
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

function emptyCollectionCell(modelNode: ModelNode, containmentName: string): VNode {
  const ws = getWsCommunication(modelNode.modelName());
  return fixedCell(
    modelNode,
    '<< ... >>',
    ['empty-collection'],
    alternativesProviderForAddingChild(modelNode, containmentName),
    null,
    () => {
      if (ws == null) {
        throw new Error('no communication through web socket available');
      }
      ws.triggerDefaultInsertion(modelNode, containmentName, (addedNodeID: NodeId) => {
        const nodeIdStr = nodeIdToString(addedNodeID);
        focusOnNode(nodeIdStr, modelNode.rootName());
      });
    },
  );
}

export function verticalCollectionCell(
  modelNode: ModelNode,
  containmentName: string,
  wrapInRows: boolean = true,
): VNode {
  const children = modelNode.childrenByLinkName(containmentName);
  const data = { dataset: { relation_represented: containmentName } };
  if (children.length === 0) {
    return h('div.vertical-collection.represent-collection', data, [emptyCollectionCell(modelNode, containmentName)]);
  } else {
    return h(
      'div.vertical-collection.represent-collection',
      data,
      map(modelNode.childrenByLinkName(containmentName), (el) => {
        if (wrapInRows) {
          return row(renderModelNode(el));
        } else {
          return renderModelNode(el);
        }
      }),
    );
  }
}

export function horizontalCollectionCell(
  modelNode: ModelNode,
  containmentName: string,
  separatorGenerator?: any,
): VNode {
  const children = modelNode.childrenByLinkName(containmentName);
  if (children.length === 0) {
    return h('div.horizontal-collection', {}, [emptyCollectionCell(modelNode, containmentName)]);
  } else {
    return h(
      'div.horizontal-collection',
      {},
      separate(
        map(modelNode.childrenByLinkName(containmentName), (el: any) => {
          if (el == null) {
            throw new Error('null value receiving while mapping on childrenByLinkName(' + containmentName + ')');
          }
          return renderModelNode(el);
        }),
        separatorGenerator,
      ),
    );
  }
}

type FlattableNode = VNode | FlattableNode[];

export function horizontalGroupCell(...elements: FlattableNode[]): VNode {
  return h('div.horizontal-group', {}, flattenArray(elements));
}

export function verticalGroupCell(...elements: FlattableNode[]): VNode {
  return h('div.vertical-group', {}, flattenArray(elements));
}

/**
 * @param modelNode
 * @param propertyName
 * @param extraClasses deprecated, use addClass instead
 */
export function editableCell(modelNode: ModelNode, propertyName: string, extraClasses: string[] = []): VNode {
  if (modelNode == null) {
    throw new Error('modelNode should not be null');
  }
  const placeholder = '<no ' + propertyName + '>';
  extraClasses = extraClasses || [];
  let extraClassesStr = '';
  if (extraClasses.length > 0) {
    extraClassesStr = '.' + extraClasses.join('.');
  }
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
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            return;
          }
          const valueInInput = $(e.target).val() as string;
          const valueInModel = modelNode.property(propertyName);
          if (valueInInput !== valueInModel) {
            const ws = getWsCommunication(modelNode.modelName());
            if (ws == null) {
              throw new Error('No WsCommunication registered for model ' + modelNode.modelName());
            }
            ws.triggerChangeOnPropertyNode(modelNode, propertyName, valueInInput);
          }
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
): VNode {
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

/*
 Here we keep the text that is typed in reference cells and it is not matching some text yet.
 */
const resolutionMemory = {};

function editingReferenceCell(
    modelNode: ModelNode,
    referenceName: string,
    alternativesProvider?: AlternativesProvider,
) : VNode {
  const resolutionMemoryKey = modelNode.idString() + '-' + referenceName;
  let memory = "";
  if (resolutionMemoryKey in resolutionMemory) {
    memory = resolutionMemory[resolutionMemoryKey];
  }
  return h('input.unresolved-reference', {
    props: {
      value: memory
    },
    on: {
      keydown: (event: KeyboardEvent) => {
        // @ts-ignore
        const v = event.target.value;
        resolutionMemory[resolutionMemoryKey] = v;
        // @ts-ignore
        if (v == "") {
          renderDataModels();
        }
      }
    },
    hook: {
      insert: (vnode: any) => {
        addAutoresize(vnode);
        if (alternativesProvider != null) {
          installAutocomplete(vnode, alternativesProvider, false);
        }
      },
      update: triggerResize,
    }
  }, []);
};

export function referenceCell(
  modelNode: ModelNode,
  referenceName: string,
  extraClasses?: string[],
  alternativesProvider?: AlternativesProvider,
  deleter?: () => void,
): VNode {
  const defaultAlternativesProvider = (suggestionsReceiver: SuggestionsReceiver) => {
    const ws = getWsCommunication(modelNode.modelName());
    ws.askAlternativesForDirectReference(modelNode, 'parent', (alternativesFromWs: any[]) => {
      // We want to put on top the alternatives from the same model
      // We want also to mark them as bold (the render should take care of that)
      // And sort the two groups by name

      const group1 = alternativesFromWs.filter((el) => el.modelName === modelNode.modelName()).sort((a,b)=>{
        if (a.label < b.label) return -1;
        if (a.label > b.label) return 1;
        return 0;
      });
      const group2 = alternativesFromWs.filter((el) => el.modelName !== modelNode.modelName()).sort((a,b)=>{
        if (a.label < b.label) return -1;
        if (a.label > b.label) return 1;
        return 0;
      });

      const suggestions1 = group1.map((el)=> {
        return {
          label: el.label,
          execute: () => {
            const ref : Ref = new Ref({model: {qualifiedName: el.modelName}, id: el.nodeId});
            (modelNode as ModelNode).setRef('parent', ref);
          },
          highlighted: true
        }
      });

      const suggestions2 = group2.map((el)=> {
        return {
          label: el.label,
          execute: () => {
            const ref : Ref = new Ref({model: {qualifiedName: el.modelName}, id: el.nodeId});
            (modelNode as ModelNode).setRef('parent', ref);
          },
          highlighted: false
        }
      });

      suggestionsReceiver(suggestions1.concat(suggestions2));
    });
  };

  alternativesProvider = alternativesProvider || defaultAlternativesProvider;

  extraClasses = extraClasses || [];
  let extraClassesStr = '';
  if (extraClasses.length > 0) {
    extraClassesStr = '.' + extraClasses.join('.');
  }

  // The cell can be in three state:
  // 1) Not matching any element, empty
  // 2) Not matching any element, with text
  // 3) Matching an element
  //
  // Case 1: when we type we move to Case 2
  // Case 2: if we type something that matches or the user select an entry we got to case 3
  // Case 3: if we type we move to case 2

  if (modelNode.ref(referenceName) == null) {

    const resolutionMemoryKey = modelNode.idString() + '-' + referenceName;
    let memory = "";
    if (resolutionMemoryKey in resolutionMemory) {
      memory = resolutionMemory[resolutionMemoryKey];
    }
    if (memory.length > 0) {
      //
      // CASE 2
      //
      return editingReferenceCell(modelNode, referenceName, alternativesProvider);
    } else {
      //
      // CASE 1
      //
      // TODO, capture any character to switch to an editable cell
      return wrapKeydownHandler(fixedCell(modelNode, `<no ${referenceName}>`, ['empty-reference'], alternativesProvider), (event)=>{
        // we cannot use keypress as it does not work and detecting if a key is printable is not trivial
        // this seems to work...
        let isPrintableKey = event.key.length === 1;
        if (isPrintableKey) {
          resolutionMemory[resolutionMemoryKey] = event.key;
          renderDataModels();
        }
        return true;
      });
    }
  }

  //
  // CASE 3
  //
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
          } else if (e.key === 'ArrowLeft') {
            moveToPrevElement(e.target);
          } else if (e.key === 'Backspace') {
            if (deleter !== undefined) {
              deleter();
              e.preventDefault();
              return false;
            }
          }
          // TODO when typing we destroy the reference
          // and we go to an editable cell
          //e.preventDefault();
          //return false;
        },
        keyup: (e: KeyboardEvent) => {
          modelNode.setRef(referenceName, null);
          const resolutionMemoryKey = modelNode.idString() + '-' + referenceName;
          // @ts-ignore
          resolutionMemory[resolutionMemoryKey] = e.target.value;
          renderDataModels();
        }
      },
    },
    [],
  );
}

export function row(...elements: FlattableNode[]): VNode {
  return h('div.row', {}, flattenArray(arguments));
}

export function emptyRow(): VNode {
  return row();
}

export function tabCell(): VNode {
  return h('div.tab', {}, []);
}
