import { LimitedModelNode, ModelNode } from './datamodel/modelNode';
import { dataToNode, limitedDataToNode } from './datamodel/registry';
import { LimitedNodeData, NodeData, ReferenceData } from './datamodel/misc';
import { UUID } from './communication/messages';
import {
  getWsCommunication,
  Intention,
  AlternativeForDirectReference,
  Alternative,
  WsCommunication,
  createInstance,
} from './communication/wscommunication';
import { getIssuesForNode } from './communication/issues';
import { IssuesMap } from './datamodel/issues';
import { IssueDescription } from './communication/messages';
import { log } from './utils/misc';
import { NodeInModel } from './datamodel/misc';
import { editorController } from './presentation/EditorController';

import { NodeId, PropertiesValues, PropertyValue } from './datamodel/misc';
import { Alternatives } from './communication/wscommunication';
import { OperationResult } from './communication/httpcommunication';

import { modelNodeToNodeInModel, nodeIdToString, refToNodeInModel } from './datamodel/misc';
import { uuidv4 } from './utils/misc';
import { NodeProcessor, reactToAReferenceChange } from './datamodel/modelNode';
import { Ref } from './datamodel/ref';
import { getDatamodelRoot, getNodeFromLocalRepo } from './datamodel/registry';
import { renderDataModels } from './facade';
import { getIssuesForModel, clearIssueMap } from './communication/issues';

export { clearIssueMap };

import {
  AddChild,
  AddChildAnswer,
  AnswerAlternatives,
  AnswerDefaultInsertion,
  AnswerForDirectReferences,
  AnswerPropertyChange,
  AskAlternatives,
  AskErrorsForNode,
  CreateIntentionsBlock,
  CreateIntentionsBlockAnswer,
  CreateRoot,
  DefaultInsertion,
  DeleteNode,
  ErrorsForModelReport,
  ErrorsForNodeReport,
  ExecuteIntention,
  GetIntentionsBlock,
  GetIntentionsBlockAnswer,
  GetNode,
  GetNodeAnswer,
  InsertNextSibling,
  InstantiateConcept,
  IntentionData,
  Message,
  NodeAdded,
  NodeIDInModel,
  nodeIDInModelFromNode,
  NodeRemoved,
  PropertyChangeNotification,
  ReferenceChange,
  RegisterForChanges,
  RequestForDirectReferences,
  RequestPropertyChange,
  SetChild,
} from './communication/messages';
import { registerIssuesForModel, registerIssuesForNode } from './communication/issues';

import { setDefaultBaseUrl, getDefaultBaseUrl, registerDataModelClass } from './datamodel/registry';
import { findNode } from './datamodel/misc';
import { baseUrlForModelName } from './facade';

import {
  fixedCell,
  referenceCell,
  horizontalCollectionCell,
  editableCell,
  emptyRow,
  childCell,
  flagCell,
  horizontalGroupCell,
  row,
  tabCell,
  verticalCollectionCell,
  verticalGroupCell,
} from './presentation/cells/types';
import { Data } from './presentation/cells/data';
import { map, focusOnNode, handleSelfDeletion, separate } from './presentation/cells/support';
import {
  addClass,
  addToDataset,
  addInsertHook,
  wrapInsertHook,
  wrapUpdateHook,
  setKey,
  wrapMouseOutHandler,
  wrapMouseOverHandler,
  addId,
  setDataset,
} from './presentation/cells/vnodemanipulation';
import {
  alternativesProviderForAbstractConcept,
  SuggestionsReceiver,
  alternativesProviderForAddingChild,
  AutocompleteAlternative,
  installAutocomplete,
} from './presentation/cells/autocompletion';
import { IData, EditedValue } from './presentation/cells/data';

import {
  autoresize,
  next,
  previous,
  inputWidthUpdate,
  myAutoresizeOptions,
  triggerFocus,
} from './presentation/uiutils';

export { autoresize, next, previous, inputWidthUpdate, myAutoresizeOptions, triggerFocus };

export {
  fixedCell,
  referenceCell,
  horizontalCollectionCell,
  editableCell,
  emptyRow,
  childCell,
  Data,
  flagCell,
  horizontalGroupCell,
  row,
  tabCell,
  verticalCollectionCell,
  verticalGroupCell,
  SuggestionsReceiver,
  addInsertHook,
  wrapInsertHook,
  wrapUpdateHook,
  addId,
};
export {
  alternativesProviderForAbstractConcept,
  addClass,
  addToDataset,
  map,
  setKey,
  wrapMouseOutHandler,
  wrapMouseOverHandler,
};
export {
  alternativesProviderForAddingChild,
  AutocompleteAlternative,
  focusOnNode,
  handleSelfDeletion,
  installAutocomplete,
  separate,
  setDataset,
};

export {
  LimitedNodeData,
  ModelNode,
  dataToNode,
  limitedDataToNode,
  LimitedModelNode,
  NodeData,
  ReferenceData,
  UUID,
  getWsCommunication,
  Intention,
  AlternativeForDirectReference,
  Alternative,
  WsCommunication,
  createInstance,
  getIssuesForNode,
  IssuesMap,
  IssueDescription,
  log,
  NodeInModel,
  editorController,
  NodeId,
  PropertiesValues,
  PropertyValue,
  Alternatives,
  modelNodeToNodeInModel,
  nodeIdToString,
  refToNodeInModel,
  uuidv4,
  NodeProcessor,
  reactToAReferenceChange,
  Ref,
  getDatamodelRoot,
  getNodeFromLocalRepo,
  renderDataModels,
  getIssuesForModel,
  AddChild,
  AddChildAnswer,
  AnswerAlternatives,
  AnswerDefaultInsertion,
  AnswerForDirectReferences,
  AnswerPropertyChange,
  AskAlternatives,
  AskErrorsForNode,
  CreateIntentionsBlock,
  CreateIntentionsBlockAnswer,
  CreateRoot,
  DefaultInsertion,
  DeleteNode,
  ErrorsForModelReport,
  ErrorsForNodeReport,
  ExecuteIntention,
  GetIntentionsBlock,
  GetIntentionsBlockAnswer,
  GetNode,
  GetNodeAnswer,
  InsertNextSibling,
  InstantiateConcept,
  IntentionData,
  Message,
  NodeAdded,
  NodeIDInModel,
  nodeIDInModelFromNode,
  NodeRemoved,
  PropertyChangeNotification,
  ReferenceChange,
  RegisterForChanges,
  RequestForDirectReferences,
  RequestPropertyChange,
  SetChild,
  registerIssuesForModel,
  registerIssuesForNode,
  setDefaultBaseUrl,
  getDefaultBaseUrl,
  registerDataModelClass,
  findNode,
  baseUrlForModelName,
  OperationResult,
  IData,
  EditedValue,
};

import { isAtEnd, isAtStart, moveDown, moveToNextElement, moveToPrevElement, moveUp } from './presentation/navigation';
export { isAtEnd, isAtStart, moveDown, moveToNextElement, moveToPrevElement, moveUp };
import {
  addAutoresize,
  domElementToModelNode,
  flattenArray,
  focusOnReference,
  handleAddingElement,
  triggerResize,
} from './presentation/cells/support';
export { addAutoresize, domElementToModelNode, flattenArray, focusOnReference, handleAddingElement, triggerResize };
import { addToDatasetObj, wrapKeydownHandler } from './presentation/cells/vnodemanipulation';
export { addToDatasetObj, wrapKeydownHandler };
import { AlternativeFilter, isAutocompleteVisible } from './presentation/cells/autocompletion';
import { renderModelNode } from './presentation/renderer';
export { AlternativeFilter, isAutocompleteVisible, renderModelNode };

import { EditorController, Observer } from './presentation/EditorController';

export { EditorController, Observer };

import { HttpCommunication } from './communication/httpcommunication';
export { HttpCommunication };

import { Renderer } from './presentation/renderer';
import { horizontalLine } from './presentation/cells/types';

export { Renderer, horizontalLine };

import { forEachDataModel, setDatamodelRoot } from './datamodel/registry';

export { forEachDataModel, setDatamodelRoot };

import { wrapKeypressHandler } from './presentation/cells/vnodemanipulation';

export { wrapKeypressHandler };

import { registerRenderer, clearRendererRegistry, getRegisteredRenderer } from './presentation/renderer';

export { registerRenderer, clearRendererRegistry, getRegisteredRenderer };

import { setup, addModel, loadDataModel, baseUrlForTarget } from './facade';
export { setup, addModel, loadDataModel, baseUrlForTarget };

import { clearDatamodelRoots } from './datamodel/registry';
export { clearDatamodelRoots };

import { patch } from './facade'
export { patch }
import { VNode } from 'snabbdom/vnode';
import { toVNode } from 'snabbdom/tovnode';
import { h, VNodeChildElement } from 'snabbdom/h';
export { VNode, toVNode, h, VNodeChildElement }
import { InsertHook, UpdateHook } from 'snabbdom/hooks';
export { InsertHook, UpdateHook }

import { nodeIDInModel } from './communication/messages';
export { nodeIDInModel }
