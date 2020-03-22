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
const datamodel = require('./datamodel.js');
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










function alternativesProvider(modelNode) {
    return function() {
        return [
            {
                label: "boolean",
                execute: function () {
                    window.wscommunication.instantiate('com.strumenta.financialcalc.BooleanType', modelNode);
                }
            },
            {
                label: "string",
                execute: function () {
                    console.log("selected string");
            }}];
    }
}

// function alternativesProvider2(modelNode) {
//     return function() {
//         return [
//             {
//                 label: "boolean",
//                 execute: function () {
//                     window.wscommunication.addChild(modelNode, 'type', 'com.strumenta.financialcalc.BooleanType');
//                 }
//             },
//             {
//                 label: "string",
//                 execute: function () {
//                     console.log("selected string");
//                 }}];
//     }
// }



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




/*
 It should be removed and implicit
 */
window.render_calc = function(modelNode) {
    return h('div#calc.editor', {}, [renderModelNode(modelNode)])
};


window.renderDataModels = function() {
    if (window.datamodel == undefined) {
        return;
    }

    let keys = Object.keys(window.datamodel);
    for (var i=0;i<keys.length;i++) {
        let key = keys[i];
        let renderFunctionName = "render_" + key;
        let renderFunction = window[renderFunctionName];
        let vnode = renderFunction(window.datamodel[key]);
        if (window.vnodes == undefined) {
            window.vnodes = {};
        }
        if (window.vnodes[key] == undefined) {
            window.vnodes[key] = toVNode($("div#"+key)[0]);
        }
        window.vnodes[key] = patch(window.vnodes[key], vnode);
    }
};

function loadDataModel(model, nodeId, target) {
    let nodeURL = "http://localhost:2904/models/" + model + "/" + nodeId;
    $.getJSON(nodeURL, function(data) {
        if (window.datamodel == undefined) {
            window.datamodel = {};
        }
        window.datamodel[target] = datamodel.dataToNode(data);
        window.datamodel[target].injectModelName(model);
        renderDataModels();
    });
}

$('document').ready(function(){
    uiutils.installAutoresize();
    window.wscommunication = new wscommunication.WsCommunication("com.strumenta.financialcalc.sandbox.company", "calc");
    loadDataModel("com.strumenta.financialcalc.sandbox.company", "324292001770075100", "calc");
});