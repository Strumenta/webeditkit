var snabbdom = require('snabbdom/snabbdom');
var patch = snabbdom.init([ // Init patch function with chosen modules
    require('snabbdom/modules/class').default, // makes it easy to toggle classes
    require('snabbdom/modules/props').default, // for setting properties on DOM elements
    require('snabbdom/modules/style').default, // handles styling on elements with support for animations
    require('snabbdom/modules/eventlisteners').default, // attaches event listeners
]);
var h = require('snabbdom/h').default; // helper function for creating vnodes
const toVNode = require('snabbdom/tovnode').default;
const uiutils = require('./uiutils');
const datamodel = require('./datamodel');
const wscommunication = require('./wscommunication');
const autocomplete = require('autocompleter');

const renderers = require('./renderer');
const registerRenderer = renderers.registerRenderer;
const renderModelNode = renderers.renderModelNode;

const cells = require('./cells');
const editableCell = cells.editableCell;
const fixedCell = cells.fixedCell;
const row = cells.row;
const emptyRow = cells.emptyRow;
const tabCell = cells.tabCell;
const verticalGroupCell = cells.verticalGroupCell;
const horizontalGroupCell = cells.horizontalGroupCell;
const verticalCollectionCell = cells.verticalCollectionCell;
const childCell = cells.childCell;
const webeditkit = require('./webeditkit');

export function setup() {
    uiutils.installAutoresize();
}

export function addModel(baseUrl, modelName, nodeId, target) {
    wscommunication.WsCommunication.createInstance("ws://" + baseUrl + "/socket", modelName, target);
    webeditkit.loadDataModel("http://" + baseUrl, modelName, nodeId, target);
}
