import h from 'snabbdom/h';
import {
  AlternativeForDirectReference,
  AlternativesForDirectReference,
  getWsCommunication,
} from '../../communication/wscommunication';
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
import { addToDatasetObj, wrapKeydownHandler } from './vnodemanipulation';
import {
  alternativesProviderForAddingChild,
  installAutocomplete,
  isAutocompleteVisible,
  SuggestionsReceiver,
} from './autocompletion';
import { NodeId, nodeIdToString, PropertyValue } from '../../datamodel/misc';
import { renderModelNode } from '../renderer';
import { VNode } from 'snabbdom/vnode';
import { renderDataModels } from '../../index';
import { ModelNode } from '../../datamodel/modelNode';
import { Ref } from '../../datamodel/ref';
import { log, uuidv4 } from '../../utils/misc';
import { EditedValue, IData } from './data';
import {BehaviorSubject, Subject} from "rxjs";
import {debounceTime, delay} from "rxjs/operators";

export function childCell(node: ModelNode, containmentName: string, emptyCell?: () => VNode): VNode {
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
    undefined,
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
  wrapInRows = true,
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
  const editedValue = data.editedValues.get(modelNode, propertyName);

  const currentValue = editedValue?.inputFieldValue ?? modelValue;

  const valueEdited = new Subject<EditedValue>();
  valueEdited.pipe(debounceTime(500)).subscribe((ev) => {
    const requestId = uuidv4();
    ev.inFlightRequestId = requestId;
    ev.inFlightValue = ev.inputFieldValue;

    getWsCommunication(modelNode.modelName()).triggerChangeOnPropertyNode(
        modelNode,
        propertyName,
        ev.inputFieldValue,
        () => {
          const currentEV = data.editedValues.get(modelNode, propertyName);

          if (currentEV == null || currentEV?.inFlightRequestId !== requestId) {
            // Ignore response to an outdated request
            return;
          }

          if (currentEV.inFlightValue === currentEV.inputFieldValue) {
            data.editedValues.delete(modelNode, propertyName);
          } else {
            currentEV.inFlightValue = undefined;
            currentEV.inFlightRequestId = undefined;
          }
        },
    );
  });

  function setEditedValue(value: string) {
    const nodeId: string = modelNode.idString();
    const ev: EditedValue = data.editedValues.getOrCreate(modelNode, propertyName);
    ev.inputFieldValue = value;
    valueEdited.next(ev);
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
          const target = e.target;
          if (target == null) {
            return;
          }
          const value = (target as HTMLInputElement).value;
          setEditedValue(value);
          if (value === '') {
            $(target).addClass('emptyProperty');
          } else {
            $(target).removeClass('emptyProperty');
          }
        },
      },
    },
    [],
  );
}

export function fixedCell(
  modelNode: ModelNode | undefined,
  text: string,
  extraClasses?: string[],
  alternativesProvider?: AlternativesProvider,
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
              deleter();
              return true;
            } else if (modelNode != null) {
              handleSelfDeletion(target, modelNode);
              e.preventDefault();
              return false;
            }
          } else if (e.key === 'Enter' && e.altKey === true) {
            // intention trigger, ignoring
            return true;
          } else if (e.key === 'Enter' && e.altKey === false) {
            if ($('.autocomplete').length === 0) {
              if (onEnter !== undefined) {
                onEnter();
                e.preventDefault();
                return false;
              } else if (alternativesProvider === undefined) {
                // We should stop this when the autocomplete is displayed

                // We do not want to do this for cells with autocompletion
                if (modelNode != null) {
                  handleAddingElement(target, modelNode);
                }
                e.preventDefault();
                return false;
              }
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
            $(vnode.elm!).val(refModelNode.name() ?? '?no name?');
            triggerResize(vnode);
          });
        },
        update: (vnode: VNode) => {
          vnode.elm!.addEventListener('keydown', kdCaptureListener, true);
          triggerResize(vnode);
        },
      },
      on: {
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
            if (deleter != null) {
              deleter();
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
