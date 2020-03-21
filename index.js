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

function triggerChangeOnPropertyNode(modelNode, propertyName, propertyValue) {
    console.log("triggerChangeOnPropertyNode", modelNode, propertyName, propertyValue);
    window.wscommunication.sendJSON({
        type: "propertyChange",
        nodeId: modelNode.idString(),
        modelName: modelNode.modelName(),
        propertyName: propertyName,
        propertyValue: propertyValue
    });
}

function editableCell(modelNode, propertyName, extraClasses) {
    if (modelNode == undefined) {
        throw "modelNode should not be undefined";
    }
    extraClasses = extraClasses || [];
    extraClassesStr = "";
    if (extraClasses.length > 0) {
        extraClassesStr = "." + extraClasses.join(".");
    }
    return h("input.editable" + extraClassesStr, {
    props:{
        value: modelNode.property(propertyName),
        required: true
    },
    hook: { insert: addAutoresize, update: triggerResize },
    on: { keyup: function(e){
            triggerChangeOnPropertyNode(modelNode, propertyName, $(e.target).val());
        }
    }}, [])
}

function fixedCell(text, extraClasses) {
    extraClasses = extraClasses || [];
    extraClassesStr = "";
    if (extraClasses.length > 0) {
        extraClassesStr = "." + extraClasses.join(".");
    }
    return h("span.fixed" + extraClassesStr, {}, [text]);
}

function row() {
    return h("div.row", {}, flattenArray(arguments));
}

function flattenArray(value) {
    return Array.from(value).flat();
}

function emptyRow() {
    return row();
}

function tabCell() {
    return h("div.tab", {}, []);
}

function map(originalArray, op) {
    return Array.from($(originalArray).map(op));
}

function registererRenderer(name, renderer) {
    if (window.renderers == undefined) {
        window.renderers = {};
    }
    window.renderers[name] = renderer;
}

function getRenderer(name) {
    if ((window.renderers == undefined) || !(name in window.renderers)){
        throw "No renderer found for " + name;
    }
    return window.renderers[name];
}

registererRenderer("com.strumenta.financialcalc.Input", function(modelNode) {
    if (modelNode == undefined) {
        throw "modelNode should not be undefined in renderer";
    }
    return horizontalGroupCell(
        editableCell(modelNode, "name"),
        fixedCell("of type", ["keyword"]),
        childCell(modelNode, "type"));
});

registererRenderer("com.strumenta.financialcalc.StringType", function(modelNode) {
    return fixedCell("string", ["type"]);
});

registererRenderer("com.strumenta.financialcalc.Type", function(modelNode) {
    return fixedCell("<TYPE>", ["type"]);
});

registererRenderer("com.strumenta.financialcalc.FinancialCalcSheet", function(modelNode) {
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

function renderModelNode(modelNode) {
    return getRenderer(modelNode.conceptName())(modelNode);
}

function childCell(modelNode, containmentName) {
    return renderModelNode(modelNode.childByLinkName(containmentName));
}

function verticalCollectionCell(modelNode, containmentName) {
    return h('div.vertical-collection', {},
        map(modelNode.childrenByLinkName(containmentName), function () {
            return row(renderModelNode(this));
        }));
}

function horizontalGroupCell() {
    return h('div.horizontal-group', {}, flattenArray(arguments));
}

function verticalGroupCell() {
    return h('div.vertical-group', {}, flattenArray(arguments));
}

window.render_calc = function(modelNode) {
    return h('div#calc.editor', {}, [renderModelNode(modelNode)])
};

function addAutoresize(vnode) {
    $(vnode.elm).autoresize(myAutoresizeOptions);
}

function triggerResize(vnode) {
    $(vnode.elm).inputWidthUpdate(myAutoresizeOptions);
}

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