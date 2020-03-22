var snabbdom = require('snabbdom/snabbdom');
var patch = snabbdom.init([ // Init patch function with chosen modules
    require('snabbdom/modules/class').default, // makes it easy to toggle classes
    require('snabbdom/modules/props').default, // for setting properties on DOM elements
    require('snabbdom/modules/style').default, // handles styling on elements with support for animations
    require('snabbdom/modules/eventlisteners').default, // attaches event listeners
]);
var h = require('snabbdom/h').default; // helper function for creating vnodes
const toVNode = require('snabbdom/tovnode').default;
const uiutils = require('./uiutils.js');
const datamodel = require('./datamodel');
const wscommunication = require('./wscommunication.js');
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

/////////////////////////////////////////////////
// Specific renderers - start
/////////////////////////////////////////////////

registerRenderer("com.strumenta.financialcalc.Input", function(modelNode) {
    if (modelNode == undefined) {
        throw "modelNode should not be undefined in renderer";
    }
    return horizontalGroupCell(
        editableCell(modelNode, "name"),
        fixedCell("of type", ["keyword"]),
        childCell(modelNode, "type"));
});

registerRenderer("com.strumenta.financialcalc.StringType", function(modelNode) {
    return fixedCell("string", ["type"]);
});

registerRenderer("com.strumenta.financialcalc.BooleanType", function(modelNode) {
    return fixedCell("boolean", ["type"]);
});

registerRenderer("com.strumenta.financialcalc.FinancialCalcSheet", function(modelNode) {
    return verticalGroupCell(
        row(
            fixedCell("Calculations", ["title"]),
            editableCell(modelNode, "name", ["title"])
        ),
        emptyRow(),
        row(
            fixedCell("inputs:", ["strong"])
        ),
        row(
            tabCell(),
            verticalCollectionCell(modelNode, 'inputs'))
    );
});

/////////////////////////////////////////////////
// Specific renderers - end
/////////////////////////////////////////////////

$('document').ready(function(){
    uiutils.installAutoresize();
    wscommunication.createInstance("ws://localhost:2904/socket", "com.strumenta.financialcalc.sandbox.company", "calc");
    webeditkit.loadDataModel("http://localhost:2904", "com.strumenta.financialcalc.sandbox.company", "324292001770075100", "calc");
});