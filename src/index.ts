var snabbdom = require('snabbdom/snabbdom');
var patch = snabbdom.init([
  // Init patch function with chosen modules
  require('snabbdom/modules/class').default, // makes it easy to toggle classes
  require('snabbdom/modules/props').default, // for setting properties on DOM elements
  require('snabbdom/modules/style').default, // handles styling on elements with support for animations
  require('snabbdom/modules/eventlisteners').default, // attaches event listeners
  require('snabbdom/modules/dataset').default,
]);
export const h = require('snabbdom/h').default; // helper function for creating vnodes
const toVNode = require('snabbdom/tovnode').default;
const uiutils = require('./uiutils');
export const datamodel = require('./datamodel');
const wscommunication = require('./wscommunication');
const autocomplete = require('autocompleter');

const renderers = require('./renderer');
export const registerRenderer = renderers.registerRenderer;
export const renderModelNode = renderers.renderModelNode;

export const cells = require('./cells');
export const editableCell = cells.editableCell;
export const referenceCell = cells.referenceCell;
export const fixedCell = cells.fixedCell;
export const row = cells.row;
export const emptyRow = cells.emptyRow;
export const tabCell = cells.tabCell;
export const verticalGroupCell = cells.verticalGroupCell;
export const horizontalGroupCell = cells.horizontalGroupCell;
export const verticalCollectionCell = cells.verticalCollectionCell;
export const horizontalCollectionCell = cells.horizontalCollectionCell;
export const childCell = cells.childCell;
export const webeditkit = require('./webeditkit');
export const registerDataModelClass = datamodel.registerDataModelClass;

export const renderDataModels = webeditkit.renderDataModels;
export const findNode = datamodel.findNode;

export function setup() {
  uiutils.installAutoresize();
}

export function addModel(baseUrl, modelName, nodeId, target) {
  wscommunication.createInstance('ws://' + baseUrl + '/socket', modelName, target);
  webeditkit.loadDataModel('http://' + baseUrl, modelName, nodeId, target);
}
