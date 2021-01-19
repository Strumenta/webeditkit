import { h, NodeData, VNode } from '../../internal';

import { AlternativeForDirectReference, getWsCommunication } from '../../internal';
import { isAtEnd, isAtStart, moveDown, moveToNextElement, moveToPrevElement, moveUp } from '../../internal';
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
} from '../../internal';
import { addToDatasetObj, wrapKeydownHandler } from '../../internal';
import {
  AlternativeFilter,
  alternativesProviderForAddingChild,
  installAutocomplete,
  isAutocompleteVisible,
  SuggestionsReceiver,
} from '../../internal';
import { NodeId, nodeIdToString } from '../../internal';
import { renderModelNode } from '../../internal';
import { renderDataModels } from '../../internal';
import { ModelNode } from '../../internal';
import { Ref } from '../../internal';
import { log } from '../../internal';
import { EditedValue, IData } from '../../internal';
import { isDeleting, unsetDeleting } from './support';
import { AutocompleteResult } from 'autocompleter';

export function childCell(
  node: ModelNode,
  containmentName: string,
  emptyCell?: () => VNode,
  filter: AlternativeFilter = () => true,
): VNode {
  const child = node.childByLinkName(containmentName);
  if (child == null) {
    if (emptyCell != null) {
      return emptyCell();
    } else {
      return fixedCell(
        node,
        `<no ${containmentName}>`,
        ['missing-element'],
        alternativesProviderForAddingChild(node, containmentName, false, filter),
      );
    }
  } else {
    return renderModelNode(child);
  }
}

interface EmptyCollectionCellOptions {
  defaultChildConcept?: string
}

function emptyCollectionCell(modelNode: ModelNode, containmentName: string,
                             options?: EmptyCollectionCellOptions): VNode {
  const ws = getWsCommunication(modelNode.modelName());
  return fixedCell(
    modelNode,
    '<< ... >>',
    ['empty-collection'],
    alternativesProviderForAddingChild(modelNode, containmentName),
    undefined,
    () => {
      if (ws == null) {
        throw new Error('no communication through web socket available');
      }
      ws.triggerDefaultInsertion(modelNode, containmentName, (addedNodeID: NodeId) => {
        const nodeIdStr = nodeIdToString(addedNodeID);
        focusOnNode(nodeIdStr, modelNode.rootName());
      }, options?.defaultChildConcept);
    },
  );
}

export interface CollectionCellOptions {
  wrapInRows?: boolean,
  extraClasses?: string[],
  defaultChildConcept?: string
}

export function verticalCollectionCell(
  modelNode: ModelNode,
  containmentName: string,
  options?: CollectionCellOptions,
): VNode {
  const extraClassesStr = extraClassesToSuffix(options?.extraClasses || []);
  const children = modelNode.childrenByLinkName(containmentName);
  const data = { dataset: { relation_represented: containmentName } };
  let baseNode;
  if (children.length === 0) {
    baseNode = h('div.vertical-collection.represent-collection' + extraClassesStr, data, [
      emptyCollectionCell(modelNode, containmentName, { defaultChildConcept: options?.defaultChildConcept }),
    ]);
  } else {
    baseNode = h(
      'div.vertical-collection.represent-collection' + extraClassesStr,
      data,
      map(modelNode.childrenByLinkName(containmentName), (el) => {
        const wrapInRows = (options != null && options.wrapInRows) || options == null;
        if (wrapInRows) {
          return row(renderModelNode(el));
        } else {
          return renderModelNode(el);
        }
      }),
    );
  }
  return wrapKeydownHandler(baseNode, (event: KeyboardEvent): boolean => {
    if (event.key === 'Enter' && event.altKey === false) {
      // it should ignore it if the autocomplete is displayed
      if (!isAutocompleteVisible()) {
        // @ts-ignore
        if (event.duringAutocomplete === true) {
          console.log('got enter during autocomplete, skipping');
        } else {
          console.log('got enter -> triggering adding element', event.target);
          const targetNode = domElementToModelNode(event.target as HTMLElement);
          console.log('  adding after', targetNode, 'container is', modelNode);
          targetNode?.insertNextSibling();
          event.stopPropagation();
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
 * @param data data structure to store uncommitted edits
 * @param modelNode
 * @param propertyName
 * @param extraClasses deprecated, use addClass instead
 */
export function editableCell(
  data: IData,
  modelNode: ModelNode,
  propertyName: string,
  extraClasses: string[] = [],
): VNode {
  if (modelNode == null) {
    throw new Error('modelNode should not be null');
  }
  const placeholder = '<no ' + propertyName + '>';

  const modelValue = modelNode.property(propertyName) || '';
  let stringValue: string;

  if (typeof modelValue === 'string') {
    stringValue = modelValue;
  } else if (typeof modelValue === 'number') {
    stringValue = modelValue.toString();
  } else if (typeof modelValue === 'boolean') {
    stringValue = modelValue.toString();
  } else if ('myNameHint' in (modelValue as any)) {
    stringValue = (modelValue as any).myNameHint;
  } else {
    const error = new Error(`Unsupported model value: ${modelValue}`);
    (error as any).modelValue = modelValue;
    throw error;
  }
  const editedValue = data.editedValues.get(modelNode, propertyName);

  const currentValue = editedValue?.inputFieldValue ?? stringValue;

  function setEditedValue(value: string) {
    const ev: EditedValue = data.editedValues.getOrCreate(modelNode, propertyName);
    ev.value = value;
  }

  const extraClassesStr = extraClassesToSuffix(extraClasses);
  return h(
    'input.editable' + extraClassesStr,
    {
      key: `${modelNode.idString()}-prop-${propertyName}`,
      props: {
        value: currentValue,
        placeholder,
        required: 'required',
      },
      class: {
        emptyProperty: currentValue === '',
      },
      hook: {
        insert: (vNode: VNode) => {
          return addAutoresize(vNode);
        },
        update: triggerResize,
      },
      on: {
        blur: (e: FocusEvent) => {
          const closest = (e.target as HTMLElement).closest('.represent-node');
          unsetDeleting(closest);
        },
        keydown: (e: KeyboardEvent) => {
          const isTabNext = e.key === 'Tab' && !e.shiftKey;
          const isTabPrev = e.key === 'Tab' && e.shiftKey;
          const target = e.target as HTMLInputElement;
          if (isTabNext) {
            moveToNextElement(target, true);
            e.preventDefault();
            return true;
          } else if (isTabPrev) {
            moveToPrevElement(target, true);
            e.preventDefault();
            return true;
          }
          if (isAtEnd(target) && e.key === 'ArrowRight') {
            moveToNextElement(target);
            e.preventDefault();
            return true;
          }
          if (isAtStart(target) && e.key === 'ArrowLeft') {
            moveToPrevElement(target);
            e.preventDefault();
            return true;
          }
          if (!isAutocompleteVisible() && e.key === 'ArrowUp') {
            moveUp(target);
            return true;
          }
          if (!isAutocompleteVisible() && e.key === 'ArrowDown') {
            moveDown(target);
            return true;
          }
          if (isAtStart(target) && e.key === 'Backspace') {
            handleSelfDeletion(target, modelNode);
            return false;
          }
          return false;
        },
        input: (e: InputEvent) => {
          const target = e.target as Element;
          if (target == null) {
            return;
          }
          const value = (target as HTMLInputElement).value;
          setEditedValue(value);
          if (value === '') {
            target.classList.add('emptyProperty');
          } else {
            target.classList.remove('emptyProperty');
          }
        },
      },
    },
    [],
  );
}

/**
 * Renders a flag cell, i.e., a cell that is either present (with fixed text) or not, tied to a boolean property.
 */
export function flagCell(modelNode: ModelNode, propertyName: string, extraClasses?: string[]) {
  const property = modelNode.property(propertyName);
  if (property === true || property === 'true') {
    return wrapKeydownHandler(fixedCell(modelNode, propertyName, ['flag', 'true']), (event) => {
      if (event.key === 'Backspace') {
        getWsCommunication(modelNode.modelName()).triggerChangeOnPropertyNode(modelNode, propertyName, false);
        return false;
      } else {
        return true;
      }
    });
  } else if (!property || property === 'false') {
    return fixedCell(modelNode, '', ['flag', 'false'], (suggestionsReceiver) => {
      suggestionsReceiver([
        {
          label: propertyName,
          execute: () => {
            getWsCommunication(modelNode.modelName()).triggerChangeOnPropertyNode(modelNode, propertyName, true);
          },
        },
      ]);
    });
  } else {
    return fixedCell(modelNode, `<not a boolean value: ${property}>`, ['error']);
  }
}

export function fixedCell(
  modelNode: ModelNode | undefined,
  text: string,
  extraClasses?: string[],
  alternativesProvider?: AlternativesProvider,
  deleter?: (doDelete: boolean) => void,
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
        insert: (vnode) => {
          addAutoresize(vnode);
          if (alternativesProvider != null) {
            installAutocomplete(vnode, alternativesProvider, true);
          }
        },
        prepatch: (oldVNode, vNode) => {
          if (!vNode.data) {
            vNode.data = {};
          }
          vNode.data.autocomplete = oldVNode.data?.autocomplete;
        },
        destroy: (vNode) => {
          if (vNode.data?.autocomplete) {
            (vNode.data.autocomplete as AutocompleteResult).destroy();
          }
        },
        update: triggerResize,
      },
      on: {
        blur: (e: FocusEvent) => {
          if (deleter) {
            deleter(false);
          } else {
            const closest = (e.target as HTMLElement).closest('.represent-node');
            unsetDeleting(closest);
          }
        },
        click: (e: MouseEvent) => {
          (e.target as HTMLInputElement).setSelectionRange(0, 0);
        },
        focus: (e: FocusEvent) => {
          (e.target as HTMLInputElement).setSelectionRange(0, 0);
        },
        keydown: (e: KeyboardEvent) => {
          const isTabNext = e.key === 'Tab' && !e.shiftKey;
          const isTabPrev = e.key === 'Tab' && e.shiftKey;
          const target = e.target as HTMLElement;
          if (isTabNext) {
            moveToNextElement(target, true);
          } else if (isTabPrev) {
            moveToPrevElement(target, true);
          } else if (e.key === 'ArrowRight') {
            moveToNextElement(target);
          } else if (e.key === 'ArrowLeft') {
            moveToPrevElement(target);
          } else if (!isAutocompleteVisible() && e.key === 'ArrowUp') {
            moveUp(target);
          } else if (!isAutocompleteVisible() && e.key === 'ArrowDown') {
            moveDown(target);
          } else if (e.key === 'Backspace') {
            if (deleter != null) {
              deleter(true);
              return true;
            } else if (modelNode != null) {
              handleSelfDeletion(target, modelNode);
              e.preventDefault();
              return false;
            }
          } else if (e.key === 'Enter' && e.altKey) {
            // intention trigger, ignoring
            return true;
          } else if (e.key === 'Enter' && !e.altKey) {
            if (!document.querySelector('.autocomplete')) {
              if (onEnter !== undefined) {
                onEnter();
              } else if (alternativesProvider === undefined) {
                // We should stop this when the autocomplete is displayed

                // We do not want to do this for cells with autocompletion
                if (modelNode != null) {
                  handleAddingElement(target, modelNode);
                }
              }
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }
          log('prevent key on fixed (C)');
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
const resolutionMemory: { [key: string]: string } = {};

function datasetForReference(modelNode: ModelNode, referenceName: string) {
  return {
    node_represented: modelNode.idString(),
    reference_represented: referenceName,
  };
}

function moveLeftRightWhenAtEnd(e: KeyboardEvent) {
  const element = e.target as HTMLInputElement;
  if (isAtEnd(element) && e.key === 'ArrowRight') {
    moveToNextElement(element as HTMLElement);
    e.preventDefault();
    return true;
  }
  if (isAtStart(element) && e.key === 'ArrowLeft') {
    moveToPrevElement(element);
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
            return;
          }
          const v = (e.target as HTMLInputElement).value;
          resolutionMemory[resolutionMemoryKey] = v;
          if (v === '') {
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
        prepatch: (oldVNode, vNode) => {
          if (!vNode.data) {
            vNode.data = {};
          }
          vNode.data.autocomplete = oldVNode.data?.autocomplete;
        },
        destroy: (vNode) => {
          if (vNode.data?.autocomplete) {
            (vNode.data.autocomplete as AutocompleteResult).destroy();
          }
        },
        update: triggerResize,
      },
    },
    [],
  );
}

export interface ReferenceCellOptions {
  extraClasses?: string[],
  alternativesProvider?: AlternativesProvider,
  deleter?: (doDelete: boolean) => void,
  opener?: (e: MouseEvent) => boolean,
  emptyCellText?: string
  emptyCellClasses?: string[]
}

export function referenceCell(
  modelNode: ModelNode,
  referenceName: string,
  options? : ReferenceCellOptions
): VNode {
  const defaultAlternativesProvider = (suggestionsReceiver: SuggestionsReceiver) => {
    const ws = getWsCommunication(modelNode.modelName());
    ws.askAlternativesForDirectReference(
      modelNode,
      referenceName,
      (alternativesFromWs: AlternativeForDirectReference[]) => {
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
              modelNode.setRef(referenceName, ref);
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
              modelNode.setRef(referenceName, ref);
              focusOnReference(modelNode, referenceName);
            },
            highlighted: false,
          };
        });

        suggestionsReceiver(suggestions1.concat(suggestions2));
      },
    );
  };

  const alternativesProvider = options?.alternativesProvider || defaultAlternativesProvider;

  const extraClasses = options?.extraClasses || [];
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
  // Case 2: if we type something that matches or the user select an entry we go to case 3
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
      const emptyText = options?.emptyCellText || `<no ${referenceName}>`;
      const emptyClasses = options?.emptyCellClasses || ['empty-reference'];
      return addToDatasetObj(
        wrapKeydownHandler(
          fixedCell(modelNode, emptyText, emptyClasses, alternativesProvider),
          (event: KeyboardEvent) => {
            if (event.ctrlKey) {
              log('should trigger autocompletion');
            } else {
              // ctrl + space should trigger autocomplete
              // we cannot use keypress as it does not work and detecting if a key is printable is not trivial
              // this seems to work...
              const isPrintableKey = event.key.length === 1;
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
    // log('capture phase in reference, keydown. Is Autocomplete visible?', isAutocompleteVisible());
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
          vnode.elm?.addEventListener('keydown', kdCaptureListener, true);
          addAutoresize(vnode);
          if (alternativesProvider != null) {
            installAutocomplete(vnode, alternativesProvider, true);
          }
          modelNode.ref(referenceName)?.loadData((refModelNode) => {
            (vnode.elm! as HTMLInputElement).value = refModelNode.name() ?? '?no name?';
            triggerResize(vnode);
          });
        },
        prepatch: (oldVNode, vNode) => {
          if (!vNode.data) {
            vNode.data = {};
          }
          vNode.data.autocomplete = oldVNode.data?.autocomplete;
        },
        destroy: (vNode) => {
          if (vNode.data?.autocomplete) {
            (vNode.data.autocomplete as AutocompleteResult).destroy();
          }
        },
        update: (vnode: VNode) => {
          vnode.elm!.addEventListener('keydown', kdCaptureListener, true);
          triggerResize(vnode);
        },
      },
      on: {
        blur: (e) => {
          if (options?.deleter) {
            options?.deleter(false);
          }
        },
        click: (e: MouseEvent) => {
          opener?.(e);
        },
        keydown: (e: KeyboardEvent) => {
          if (moveLeftRightWhenAtEnd(e)) {
            return;
          }
          const target = e.target as HTMLInputElement;
          if (!isAutocompleteVisible() && e.key === 'ArrowUp') {
            moveUp(target);
          } else if (!isAutocompleteVisible() && e.key === 'ArrowDown') {
            moveDown(target);
          } else if (e.key === 'Backspace') {
            if (options?.deleter != null) {
              options?.deleter(true);
              e.preventDefault();
              return;
            }
          }
          if (e.key === 'Enter' && e.altKey === false) {
            log('enter on reference cell', e);
            // @ts-ignore
            e.insertionEnter = true;
          }
          // TODO when typing we destroy the reference
          // and we go to an editable cell
          //
          // e.preventDefault();
          // return false;
        },
        keyup: (e: KeyboardEvent) => {
          modelNode.ref(referenceName)?.loadData((refNode) => {
            if (refNode.name() !== (e.target as HTMLInputElement).value) {
              modelNode.setRef(referenceName, undefined);
              const resolutionMemoryKey = modelNode.idString() + '-' + referenceName;
              // @ts-ignore
              resolutionMemory[resolutionMemoryKey] = (e.target as HTMLInputElement).value;
              renderDataModels(() => {
                focusOnReference(modelNode, referenceName);
              });
            }
          });
        },
      },
    },
    [],
  );
}

export function row(...elements: FlattableNode[]): VNode {
  return h('div.row', {}, flattenArray(elements));
}

export function emptyRow(): VNode {
  return row();
}

export function tabCell(): VNode {
  return h('div.tab', {}, []);
}

export function horizontalLine(): VNode {
  return h('div.horizontal-line', {}, []);
}

export function alias(node: ModelNode, extraClasses: string[] = []): VNode {
  return fixedCell(node, node.conceptAlias as string, extraClasses);
}

export function name(data: IData, node: ModelNode, extraClasses: string[] = []) {
  return editableCell(data, node, 'name', extraClasses);
}

export function keyword(modelNode: ModelNode, text: string): VNode {
  return fixedCell(modelNode, text, ['keyword']);
}

export function abstractElementCell(modelNode: ModelNode): VNode {
  return fixedCell(modelNode, `<choose ${modelNode.simpleConceptName()}>`, ['abstractCell'], (suggestionsReceiver: SuggestionsReceiver) => {
    const ws = getWsCommunication(modelNode.modelName());
    const containmentName = modelNode.containmentName() as string;
    const filter = () => true;
    ws.askAlternatives(modelNode.parent() as ModelNode, containmentName, (alternatives) => {
      const adder = (conceptName: string, node?: NodeData) => () => {
        ws.instantiate(conceptName, modelNode);
      };
      const uiAlternatives = Array.from(
        alternatives.filter(filter).map((alt, index) => {
          return { label: alt.node ? alt.node.name : alt.alias, execute: adder(alt.conceptName, alt.node) };
        }),
      );
      suggestionsReceiver(uiAlternatives);
    });
  });
}
