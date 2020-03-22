var h = require('snabbdom/h').default; // helper function for creating vnodes
var renderer = require('./renderer');

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

function addAutoresize(vnode) {
    $(vnode.elm).autoresize(myAutoresizeOptions);
}

function triggerResize(vnode) {
    $(vnode.elm).inputWidthUpdate(myAutoresizeOptions);
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



function emptyRow() {
    return row();
}

function tabCell() {
    return h("div.tab", {}, []);
}

function flattenArray(value) {
    return Array.from(value).flat();
}

function childCell(modelNode, containmentName) {
    let child = modelNode.childByLinkName(containmentName);
    if (child == null) {
        return fixedCell("<no "+containmentName + ">", ["missing-element"], alternativesProviderForAddingChild(modelNode, containmentName));
    }
    return renderer.renderModelNode(child);
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
                return row(renderer.renderModelNode(this));
            }));
    }
}

function horizontalGroupCell() {
    return h('div.horizontal-group', {}, flattenArray(arguments));
}

function verticalGroupCell() {
    return h('div.vertical-group', {}, flattenArray(arguments));
}

function map(originalArray, op) {
    return Array.from($(originalArray).map(op));
}


module.exports.childCell = childCell;
module.exports.verticalCollectionCell = verticalCollectionCell;
module.exports.horizontalGroupCell = horizontalGroupCell;
module.exports.verticalGroupCell = verticalGroupCell;
module.exports.editableCell = editableCell;
module.exports.fixedCell = fixedCell;
module.exports.row = row;
module.exports.emptyRow = emptyRow;
module.exports.tabCell = tabCell;