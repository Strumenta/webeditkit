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

function dataToNode(data) {
    if (data == null) {
        return null;
    }
    return new ModelNode(data)
}

class ModelNode {
    constructor(data) {
        this.data = data;
    }
    childByLinkName(linkName) {
        let filtered = this.data.children.filter(function(el){return el.containingLink == linkName;})
        if (filtered.length == 0) {
            return null;
        } else if (filtered.length == 1) {
            return dataToNode(filtered[0]);
        } else {
            throw "Unexpected to find multiple children for link name " + linkName;
        }
    }
    childrenByLinkName(linkName) {
        let filtered = this.data.children.filter(function(el){return el.containingLink == linkName;})
        return $(filtered).map(function() { return dataToNode(this); });
    }
    property(propertyName) {
        return this.data.properties[propertyName];
    }
    ref(referenceName) {
        return new Ref(this.data.refs[referenceName]);
    }
    name() {
        return this.property("name");
    }
    idString() {
        return this.data.id.regularId;
    }
    simpleConceptName() {
        let parts = this.data.concept.split(".");
        let simpleName = parts[parts.length - 1];
        return simpleName;
    }
}

window.render_calc = function() {
    return h('div#calc.editor', {}, [
        h("span.title.fixed", {}, ["Calculations"]),
        h("input.editable.title", {
            props:{
                value: "ciao",
                //value:window.datamodel.activity.labelText(),
                required: true
            },
            hook: { insert: addAutoresize, update: triggerResize },
            /*on: { keyup: function(e){
                    triggerChangeOnPropertyNode(window.activity.childByLinkName("label").idString(), "text", $(e.target).val());
                }
            }*/}, [])
    ])
};

function addAutoresize(vnode) {
    $(vnode.elm).autoresize(myAutoresizeOptions);
}

function triggerResize(vnode) {
    $(vnode.elm).inputWidthUpdate(myAutoresizeOptions);
}

function renderDataModels() {
    console.log("render", window.datamodel);
    if (window.datamodel == undefined) {
        return;
    }

    let keys = Object.keys(window.datamodel);
    for (var i=0;i<keys.length;i++) {
        let key = keys[i];
        let renderFunctionName = "render_" + key;
        console.log("renderFunctionName", renderFunctionName);
        let renderFunction = window[renderFunctionName];
        console.log("renderFunction", renderFunction);
        let vnode = renderFunction();
        if (window.vnodes == undefined) {
            window.vnodes = {};
        }
        if (window.vnodes[key] == undefined) {
            window.vnodes[key] = toVNode($("div#"+key)[0]);
        }
        window.vnodes[key] = patch(window.vnodes[key], vnode);
    }
}

function loadDataModel(model, nodeId, target) {
    let nodeURL = "http://localhost:2904/models/" + model + "/" + nodeId;
    $.getJSON(nodeURL, function(data) {
        if (window.datamodel == undefined) {
            window.datamodel = {}
        }
        window.datamodel[target] = dataToNode(data);
        renderDataModels();
    });
}

$('document').ready(function(){
    uiutils.installAutoresize();
    loadDataModel("com.strumenta.financialcalc.sandbox.company", "324292001770075100", "calc");
});