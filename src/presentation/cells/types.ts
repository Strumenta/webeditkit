import h from 'snabbdom/h';
import { getWsCommunication } from '../../communication/wscommunication';
import { isAtEnd, isAtStart, moveDown, moveToNextElement, moveToPrevElement, moveUp } from '../navigation';
import {
  addAutoresize,
  domElementToModelNode,
  flattenArray,
  focusOnNode,
  focusOnReference,
  handleAddingElement,
  handleSelfDeletion,
  map,
  separate,
  triggerResize,
} from './support';
import { addClass, addToDatasetObj, wrapKeydownHandler } from './vnodemanipulation';
import {
  alternativesProviderForAddingChild,
  installAutocomplete,
  isAutocompleteVisible,
  SuggestionsReceiver,
} from './autocompletion';
import { NodeId, nodeIdToString } from '../../datamodel/misc';
import { renderModelNode } from '../renderer';
import { VNode } from 'snabbdom/vnode';
import { renderDataModels } from '../../index';
import { ModelNode } from '../../datamodel/modelNode';
import { Ref } from '../../datamodel/ref';
import { printFocus } from '../uiutils';

export function childCell(
  node: ModelNode,
  containmentName: string,
  emptyCell: () => VNode | undefined = undefined,
): VNode {
  const child = node.childByLinkName(containmentName);
  if (child == null) {
    if (emptyCell != null) {
      return emptyCell();
    }
    return fixedCell(
      node,
      '<no ' + containmentName + '>',
      ['missing-element'],
      alternativesProviderForAddingChild(node, containmentName),
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
  extraClasses: string[] = [],
): VNode {
  const extraClassesStr = extraClassesToSuffix(extraClasses);
  const children = modelNode.childrenByLinkName(containmentName);
  const data = { dataset: { relation_represented: containmentName } };
  let baseNode;
  if (children.length === 0) {
    baseNode = h('div.vertical-collection.represent-collection' + extraClassesStr, data, [
      emptyCollectionCell(modelNode, containmentName),
    ]);
  } else {
    baseNode = h(
      'div.vertical-collection.represent-collection' + extraClassesStr,
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
  return wrapKeydownHandler(baseNode, (event: KeyboardEvent): boolean => {
    if (event.key == 'Enter') {
      // it should ignore it if the autocomplete is displayed
      if (!isAutocompleteVisible()) {
        // if (!event.defaultPrevented) {
        //   console.log("got enter", event);
        // } else {
        //   console.log("got enter avoided because default prevented", event);
        // }
        // @ts-ignore
        if (event.duringAutocomplete == true) {
          console.log('got enter during autocomplete, skipping');
        } else {
          console.log('got enter -> triggering adding element', event.target);
          const targetNode = domElementToModelNode(event.target as HTMLElement);
          console.log('  adding after', targetNode, 'container is', modelNode);
          targetNode.insertNextSibling();
        }
      }
      return true;
    }
    return false;
  });
}

export function horizontalCollectionCell(
  modelNode: ModelNode,
  containmentName: string,
  separatorGenerator?: () => VNode,
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

function extraClassesToSuffix(extraClasses: string[]): string {
  extraClasses = extraClasses || [];
  let extraClassesStr = '';
  if (extraClasses.length > 0) {
    extraClassesStr = '.' + extraClasses.join('.');
  }
  return extraClassesStr;
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
  const extraClassesStr = extraClassesToSuffix(extraClasses);
  const initialValue = modelNode.property(propertyName) || '';
  return h(
    'input.editable' + extraClassesStr,
    {
      key: `${modelNode.idString()}-prop-${propertyName}`,
      props: {
        value: initialValue,
        placeholder,
        required: true,
      },
      hook: {
        insert: (vNode: VNode) => {
          if (initialValue == '') {
            $(vNode.elm).addClass('emptyProperty');
          }
          return addAutoresize(vNode);
        },
        update: triggerResize,
      },
      on: {
        keydown: (e: KeyboardEvent) => {
          const isTabNext = e.key === 'Tab' && !e.shiftKey;
          const isTabPrev = e.key === 'Tab' && e.shiftKey;
          if (isTabNext) {
            moveToNextElement(e.target, true);
            e.preventDefault();
            return true;
          } else if (isTabPrev) {
            moveToPrevElement(e.target, true);
            e.preventDefault();
            return true;
          }
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
          if (!isAutocompleteVisible() && e.key === 'ArrowUp') {
            moveUp(e.target);
            return true;
          }
          if (!isAutocompleteVisible() && e.key === 'ArrowDown') {
            moveDown(e.target);
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
          if (valueInInput == '') {
            $(e.target).addClass('emptyProperty');
          } else {
            $(e.target).removeClass('emptyProperty');
          }
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
          const isTabNext = e.key === 'Tab' && !e.shiftKey;
          const isTabPrev = e.key === 'Tab' && e.shiftKey;
          if (isTabNext) {
            moveToNextElement(e.target, true);
          } else if (isTabPrev) {
            moveToPrevElement(e.target, true);
          } else if (e.key === 'ArrowRight') {
            moveToNextElement(e.target);
          } else if (e.key === 'ArrowLeft') {
            moveToPrevElement(e.target);
          } else if (!isAutocompleteVisible() && e.key === 'ArrowUp') {
            moveUp(e.target);
          } else if (!isAutocompleteVisible() && e.key === 'ArrowDown') {
            moveDown(e.target);
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
                console.log('prevent enter on fixed (A)');
                onEnter();
                e.preventDefault();
                return false;
              } else if (alternativesProvider === undefined) {
                console.log('prevent enter on fixed (B)');
                // We should stop this when the autocomplete is displayed

                // We do not want to do this for cells with autocompletion
                handleAddingElement(e.target, modelNode);
                e.preventDefault();
                return false;
              }
            }
          }
          console.log('prevent key on fixed (C)');
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

function datasetForReference(modelNode: ModelNode, referenceName: string) {
  return {
    node_represented: modelNode.idString(),
    reference_represented: referenceName,
  };
}

function moveLeftRightWhenAtEnd(e: KeyboardEvent) {
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
  return false;
}

function editingReferenceCell(
  modelNode: ModelNode,
  referenceName: string,
  alternativesProvider?: AlternativesProvider,
): VNode {
  const resolutionMemoryKey = modelNode.idString() + '-' + referenceName;
  let memory = '';
  if (resolutionMemoryKey in resolutionMemory) {
    memory = resolutionMemory[resolutionMemoryKey];
  }
  return h(
    'input.unresolved-reference',
    {
      props: {
        value: memory,
      },
      dataset: datasetForReference(modelNode, referenceName),
      on: {
        keydown: (e: KeyboardEvent) => {
          if (moveLeftRightWhenAtEnd(e)) {
            return true;
          }
          // @ts-ignore
          const v = e.target.value;
          resolutionMemory[resolutionMemoryKey] = v;
          // @ts-ignore
          if (v == '') {
            renderDataModels(() => {
              focusOnReference(modelNode, referenceName);
            });
          }
        },
      },
      hook: {
        insert: (vnode: any) => {
          addAutoresize(vnode);
          if (alternativesProvider != null) {
            installAutocomplete(vnode, alternativesProvider, false);
          }
        },
        update: triggerResize,
      },
    },
    [],
  );
}

export function referenceCell(
  modelNode: ModelNode,
  referenceName: string,
  extraClasses?: string[],
  alternativesProvider?: AlternativesProvider,
  deleter?: () => void,
  opener?: (e: MouseEvent) => boolean,
): VNode {
  const defaultAlternativesProvider = (suggestionsReceiver: SuggestionsReceiver) => {
    const ws = getWsCommunication(modelNode.modelName());
    ws.askAlternativesForDirectReference(modelNode, referenceName, (alternativesFromWs: any[]) => {
      // We want to put on top the alternatives from the same model
      // We want also to mark them as bold (the render should take care of that)
      // And sort the two groups by name

      const group1 = alternativesFromWs
        .filter((el) => el.modelName === modelNode.modelName())
        .sort((a, b) => {
          if (a.label < b.label) return -1;
          if (a.label > b.label) return 1;
          return 0;
        });
      const group2 = alternativesFromWs
        .filter((el) => el.modelName !== modelNode.modelName())
        .sort((a, b) => {
          if (a.label < b.label) return -1;
          if (a.label > b.label) return 1;
          return 0;
        });

      const suggestions1 = group1.map((el) => {
        return {
          label: el.label,
          execute: () => {
            const ref: Ref = new Ref({ model: { qualifiedName: el.modelName }, id: el.nodeId });
            (modelNode as ModelNode).setRef(referenceName, ref);
            focusOnReference(modelNode, referenceName);
          },
          highlighted: true,
        };
      });

      const suggestions2 = group2.map((el) => {
        return {
          label: el.label,
          execute: () => {
            const ref: Ref = new Ref({ model: { qualifiedName: el.modelName }, id: el.nodeId });
            (modelNode as ModelNode).setRef(referenceName, ref);
            focusOnReference(modelNode, referenceName);
          },
          highlighted: false,
        };
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

  // The cell can be in three states:
  // 1) Not matching any element, empty
  // 2) Not matching any element, with text
  // 3) Matching an element
  //
  // Case 1: when we type we move to Case 2
  // Case 2: if we type something that matches or the user select an entry we got to case 3
  // Case 3: if we type we move to case 2

  if (modelNode.ref(referenceName) == null) {
    const resolutionMemoryKey = modelNode.idString() + '-' + referenceName;
    let memory = '';
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
      return addToDatasetObj(
        wrapKeydownHandler(
          fixedCell(modelNode, `<no ${referenceName}>`, ['empty-reference'], alternativesProvider),
          (event: KeyboardEvent) => {
            if (event.ctrlKey) {
              console.log('should trigger autocompletion');
            } else {
              // ctrl + space should trigger autocomplete
              // we cannot use keypress as it does not work and detecting if a key is printable is not trivial
              // this seems to work...
              let isPrintableKey = event.key.length === 1;
              if (isPrintableKey) {
                resolutionMemory[resolutionMemoryKey] = event.key;
                renderDataModels(() => {
                  focusOnReference(modelNode, referenceName);
                });
              }
            }
            return true;
          },
        ),
        datasetForReference(modelNode, referenceName),
      );
    }
  }

  //
  // CASE 3
  //
  const kdCaptureListener = (event: KeyboardEvent): boolean => {
    // TODO move this into the body
    //console.log('capture phase in reference, keydown. Is Autocomplete visible?', isAutocompleteVisible());
    if (isAutocompleteVisible()) {
      // @ts-ignore
      event.duringAutocomplete = true;
    }
    return true;
  };
  return h(
    'input.reference' + extraClassesStr,
    {
      dataset: datasetForReference(modelNode, referenceName),
      props: { value: 'Loading...' },
      hook: {
        insert: (vnode: VNode) => {
          vnode.elm.addEventListener('keydown', kdCaptureListener, true);
          addAutoresize(vnode);
          if (alternativesProvider != null) {
            installAutocomplete(vnode, alternativesProvider, true);
          }
          modelNode.ref(referenceName).loadData((refModelNode) => {
            $(vnode.elm).val(refModelNode.name());
            triggerResize(vnode);
          });
        },
        update: (vnode: VNode) => {
          vnode.elm.addEventListener('keydown', kdCaptureListener, true);
          triggerResize(vnode);
        },
      },
      on: {
        click: (e: MouseEvent) => {
          if (opener != null) {
            return opener(e);
          }
        },
        keydown: (e: KeyboardEvent) => {
          if (moveLeftRightWhenAtEnd(e)) {
            return true;
          }
          if (!isAutocompleteVisible() && e.key === 'ArrowUp') {
            moveUp(e.target);
          } else if (!isAutocompleteVisible() && e.key === 'ArrowDown') {
            moveDown(e.target);
          } else if (e.key === 'Backspace') {
            if (deleter != null) {
              printFocus('before deleter');
              deleter();
              printFocus('after deleter');
              e.preventDefault();
              return false;
            }
          }
          if (e.key == 'Enter') {
            console.log('enter on reference cell', e);
            // @ts-ignore
            e.insertionEnter = true;
          }
          // TODO when typing we destroy the reference
          // and we go to an editable cell
          //e.preventDefault();
          //return false;
        },
        keyup: (e: KeyboardEvent) => {
          modelNode.ref(referenceName).loadData((refNode) => {
            // @ts-ignore
            if (refNode.name() != e.target.value) {
              printFocus('keyup, before setting ref');
              modelNode.setRef(referenceName, null);
              printFocus('keyup, after setting ref');
              const resolutionMemoryKey = modelNode.idString() + '-' + referenceName;
              // @ts-ignore
              resolutionMemory[resolutionMemoryKey] = e.target.value;
              printFocus('keyup, before renderDataModels');
              renderDataModels(() => {
                focusOnReference(modelNode, referenceName);
              });
              printFocus('keyup, after renderDataModels');
            }
          });
        },
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
