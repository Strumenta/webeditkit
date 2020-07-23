import { LimitedModelNode, ModelNode } from './datamodel/modelNode';
import { dataToNode, limitedDataToNode } from './datamodel/registry';
import { LimitedNodeData, NodeData, ReferenceData } from './datamodel/misc';
import { UUID } from './communication/messages';
import { getWsCommunication, Alternative, WsCommunication, createInstance } from './communication/wscommunication';
import { getIssuesForNode } from './communication/issues';
import { IssuesMap } from './datamodel/issues';
import { IssueDescription } from './communication/messages';
import { log } from './utils/misc';
import { NodeInModel } from './datamodel/misc';
import { editorController } from './presentation';

import { NodeId, PropertiesValues, PropertyValue } from './datamodel/misc';
import { Alternatives } from './communication/wscommunication';
import {OperationResult} from './communication/httpcommunication';

import {
  modelNodeToNodeInModel,
  nodeIdToString,
  refToNodeInModel,
} from './datamodel/misc';
import { uuidv4 } from './utils/misc';
import { NodeProcessor, reactToAReferenceChange } from './datamodel/modelNode';
import { Ref } from './datamodel/ref';
import { getDatamodelRoot, getNodeFromLocalRepo } from './datamodel/registry';
import { renderDataModels } from './facade';
import { getIssuesForModel } from './communication/issues';

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
import { IData} from './presentation/cells/data'

export {
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

export {LimitedNodeData,ModelNode, dataToNode, limitedDataToNode, LimitedModelNode, NodeData, ReferenceData, UUID,
  getWsCommunication, Alternative, WsCommunication, createInstance, getIssuesForNode, IssuesMap, IssueDescription, log,
NodeInModel, editorController, NodeId, PropertiesValues, PropertyValue, Alternatives,
modelNodeToNodeInModel, nodeIdToString, refToNodeInModel, uuidv4, NodeProcessor, reactToAReferenceChange, Ref,
getDatamodelRoot, getNodeFromLocalRepo, renderDataModels, getIssuesForModel, AddChild,
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
  SetChild, registerIssuesForModel, registerIssuesForNode, setDefaultBaseUrl, getDefaultBaseUrl, registerDataModelClass, findNode,
  baseUrlForModelName, OperationResult, IData}
