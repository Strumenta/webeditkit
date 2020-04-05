import {
  fixedCell,
  referenceCell,
  horizontalCollectionCell,
  editableCell,
  emptyRow,
  childCell,
  horizontalGroupCell,
  row,
  tabCell,
  verticalCollectionCell,
  verticalGroupCell,
} from './cells';

export {
  fixedCell,
  referenceCell,
  horizontalCollectionCell,
  editableCell,
  emptyRow,
  childCell,
  horizontalGroupCell,
  row,
  tabCell,
  verticalCollectionCell,
  verticalGroupCell,
};

export const h = require('snabbdom/h').default; // helper function for creating vnodes
const uiutils = require('./uiutils');
export const datamodel = require('./datamodel');
const wscommunication = require('./wscommunication');
export const cells = require('./cells');

const renderers = require('./renderer');
export const registerRenderer = renderers.registerRenderer;
export const renderModelNode = renderers.renderModelNode;
export const webeditkit = require('./webeditkit');
export const registerDataModelClass = datamodel.registerDataModelClass;

export const renderDataModels = webeditkit.renderDataModels;
export const findNode = datamodel.findNode;

export function setup() {
  uiutils.installAutoresize();
}

export function addModel(baseUrl: string, modelName: string, nodeId, target: string) {
  wscommunication.createInstance('ws://' + baseUrl + '/socket', modelName, target);
  webeditkit.loadDataModel('http://' + baseUrl, modelName, nodeId, target);
}
