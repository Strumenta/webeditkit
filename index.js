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

function editableCell(modelNode, propertyName, extraClasses, opts) {
    let placeholder = "<no " + propertyName+">";
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
        placeholder: placeholder,
        required: true
    },
    hook: { insert: addAutoresize, update: triggerResize },
    on: { keyup: function(e){
            window.wscommunication.triggerChangeOnPropertyNode(modelNode, propertyName, $(e.target).val());
        }
    }}, [])
}

function installAutocomplete(vnode, valuesProvider, fixed) {
    let input = vnode.elm;
    // $(input).keyup(function(){
    //     console.log("keyup autocomplete");
    //     let text = input.value.toLowerCase();
    //     console.log("VALUES " + valuesProvider(input));
    //     let matched = valuesProvider(input).filter(n => n.label.toLowerCase() == text);
    //     console.log("TEXT "+text+" MATCHED " + matched);
    //     if (matched.length == 1) {
    //         autocompleteTriggered(input, matched[0]);
    //     } else {
    //         $(input).attr("selected-id", null);
    //         //$(input).removeClass("selection-done");
    //     }
    // });
    autocomplete({
        input: input,
        minLength: 0,
        render: function(item, currentValue) {
            var div = document.createElement("div");
            div.className = "autocomplete-item";
            div.textContent = item.label;
            return div;
        },
        // renderGroup: function(groupName, currentValue) {
        //     var div = document.createElement("div");
        //     div.className = "autosuggest-group";
        //     div.textContent = groupName;
        //     return div;
        // },
        fetch: function (text, update) {
            text = text.toLowerCase();
            //var suggestions = ["A", "B", "C", "doo", "foo"];
            valuesProvider(function(suggestions) {
                if (!fixed) {
                    suggestions = suggestions.filter(n => n.label.toLowerCase().startsWith(text));
                }
                update(suggestions);
            });
        },
        onSelect: function (item) {
            item.execute();
        },
        customize: function(input, inputRect, container, maxHeight) {
            $(container).css('width', 'auto');
        }
    });
}

function fixedCell(text, extraClasses, alternativesProvider) {
    extraClasses = extraClasses || [];
    extraClassesStr = "";
    if (extraClasses.length > 0) {
        extraClassesStr = "." + extraClasses.join(".");
    }
    return h("input.fixed" + extraClassesStr, {
        props: {value:text},
        hook: {
            insert: function(vnode){
                addAutoresize(vnode);
                if (alternativesProvider != null && alternativesProvider != undefined) {
                    installAutocomplete(vnode, alternativesProvider, true);
                }
            },
            update: triggerResize },
        }, []);
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

function alternativesProviderForAddingChild(modelNode, containmentName) {
    // we should get all the alternatives from the server
    return function (alternativesUser) {
        window.wscommunication.askAlternatives(modelNode, containmentName, function (alternatives) {
           let adder = function(conceptName){
               return function() {
                   window.wscommunication.addChild(modelNode, containmentName, conceptName);
               };
           };
           let uiAlternatives = Array.from($(alternatives).map(function(){ return {label: this.alias, execute: adder(this.conceptName)}}));
           console.log("uiAlternatives", uiAlternatives);
           window.uia = uiAlternatives;
           alternativesUser(uiAlternatives);
        });
    };
}

function getDefaultRenderer(modelNode) {
    let abstractConcept = modelNode.isAbstract();
    let conceptName = modelNode.simpleConceptName();
    return function (dataModel) {
        if (abstractConcept) {
            return fixedCell("", ['default-cell-abstract'], alternativesProvider(modelNode));
        } else {
            return fixedCell("[default " + conceptName + "]", ['default-cell-concrete']);
        }
    };
}

function getRenderer(modelNode) {
    if (modelNode == null) {
        // it happens during node replacements
        return function() { return fixedCell("null"); };
    }
    let abstractConcept = modelNode.isAbstract();
    let conceptName = modelNode.conceptName();
    return renderers.getRegisteredRenderer(conceptName) || getDefaultRenderer(modelNode);
}

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

function renderModelNode(modelNode) {
    return getRenderer(modelNode)(modelNode);
}

function childCell(modelNode, containmentName) {
    let child = modelNode.childByLinkName(containmentName);
    if (child == null) {
        return fixedCell("<no "+containmentName + ">", ["missing-element"], alternativesProviderForAddingChild(modelNode, containmentName));
    }
    return renderModelNode(child);
}

function verticalCollectionCell(modelNode, containmentName) {
    let addInputChild = function() {
        window.wscommunication.addChild(modelNode, containmentName, 'com.strumenta.financialcalc.Input');
    };
    let children = modelNode.childrenByLinkName(containmentName);
    if (children.length == 0) {
        return h('div.vertical-collection', {}, [
            fixedCell("<< ... >>", ['empty-collection'], function (alternativesUser) {
                alternativesUser([{label: "Input", execute: addInputChild}]);
            })]);
    } else {
        return h('div.vertical-collection', {},
            map(modelNode.childrenByLinkName(containmentName), function () {
                return row(renderModelNode(this));
            }));
    }
}

function horizontalGroupCell() {
    return h('div.horizontal-group', {}, flattenArray(arguments));
}

function verticalGroupCell() {
    return h('div.vertical-group', {}, flattenArray(arguments));
}

/*
 It should be removed and implicit
 */
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