var h = require('snabbdom/h').default; // helper function for creating vnodes
var renderer = require('./renderer');
const autocomplete = require('autocompleter');

function alternativesProviderForAbstractConcept(modelNode) {
    return alternativesProviderForAddingChild(modelNode.parent(), modelNode.containmentName(), true);
}

function alternativesProviderForAddingChild(modelNode, containmentName, replacing) {
    if (replacing == undefined) {
        replacing = false;
    }
    // we should get all the alternatives from the server
    return function (alternativesUser) {
        window.wscommunication.askAlternatives(modelNode, containmentName, function (alternatives) {
            let adder = function(conceptName){
                return function() {
                    if (replacing) {
                        window.wscommunication.setChild(modelNode, containmentName, conceptName);
                    } else {
                        window.wscommunication.addChild(modelNode, containmentName, conceptName);
                    }
                };
            };
            let uiAlternatives = Array.from($(alternatives).map(function(){ return {label: this.alias, execute: adder(this.conceptName)}}));
            alternativesUser(uiAlternatives);
        });
    };
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
module.exports.alternativesProviderForAbstractConcept = alternativesProviderForAbstractConcept;