var h = require('snabbdom/h').default; // helper function for creating vnodes
var renderer = require('./renderer');
const autocomplete = require('autocompleter');
const uiutils = require('./uiutils');
const wscommunication = require('./wscommunication');

function alternativesProviderForAbstractConcept(modelNode: ModelNode) {
    return alternativesProviderForAddingChild(modelNode.parent(), modelNode.containmentName(), true);
}

function alternativesProviderForAddingChild(modelNode: ModelNode, containmentName: string, replacing: boolean) {
    if (replacing == undefined) {
        replacing = false;
    }
    // we should get all the alternatives from the server
    return function (alternativesUser: any) {
        let ws = wscommunication.getWsCommunication(modelNode.modelName());
        ws.askAlternatives(modelNode, containmentName, function (alternatives: any) {
            let adder = function(conceptName: string){
                return function() {
                    if (replacing) {
                        ws.setChild(modelNode, containmentName, conceptName);
                    } else {
                        ws.addChild(modelNode, containmentName, conceptName);
                    }
                };
            };
            let uiAlternatives = Array.from($(alternatives).map(function(){ return {label: this.alias, execute: adder(this.conceptName)}}));
            alternativesUser(uiAlternatives);
        });
    };
}

function installAutocomplete(vnode: any, valuesProvider: any, fixed: boolean) {
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
        render: function(item: any, currentValue: any) {
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
        fetch: function (text: string, update: any) {
            text = text.toLowerCase();
            //var suggestions = ["A", "B", "C", "doo", "foo"];
            valuesProvider(function(suggestions: any) {
                if (!fixed) {
                    suggestions = suggestions.filter((n: { label: string; }) => n.label.toLowerCase().startsWith(text));
                }
                update(suggestions);
            });
        },
        onSelect: function (item: any) {
            item.execute();
        },
        customize: function(input: any, inputRect: any, container: any, maxHeight: any) {
            $(container).css('width', 'auto');
        }
    });
}

function editableCell(modelNode: ModelNode, propertyName: string, extraClasses: Array<string>) {
    let placeholder = "<no " + propertyName+">";
    if (modelNode == undefined) {
        throw "modelNode should not be undefined";
    }
    extraClasses = extraClasses || [];
    let extraClassesStr = "";
    if (extraClasses.length > 0) {
        extraClassesStr = "." + extraClasses.join(".");
    }
    let ws = wscommunication.getWsCommunication(modelNode.modelName());
    return h("input.editable" + extraClassesStr, {
        props:{
            value: modelNode.property(propertyName),
            placeholder: placeholder,
            required: true
        },
        hook: { insert: addAutoresize, update: triggerResize },
        on: { keyup: function(e: any){
                ws.triggerChangeOnPropertyNode(modelNode, propertyName, $(e.target).val());
            }
        }}, [])
}

function addAutoresize(vnode: any) {
    // @ts-ignore
    $(vnode.elm).autoresize(uiutils.myAutoresizeOptions);
}

function triggerResize(vnode: any) {
    // @ts-ignore
    $(vnode.elm).inputWidthUpdate(uiutils.myAutoresizeOptions);
}

function fixedCell(text: string, extraClasses: Array<string>, alternativesProvider: any) {
    extraClasses = extraClasses || [];
    let extraClassesStr = "";
    if (extraClasses.length > 0) {
        extraClassesStr = "." + extraClasses.join(".");
    }
    return h("input.fixed" + extraClassesStr, {
        props: {value:text},
        hook: {
            insert: function(vnode: any){
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

function flattenArray(value: any) {
    // @ts-ignore
    return Array.from(value).flat();
}

function childCell(modelNode: ModelNode, containmentName: string) {
    let child = modelNode.childByLinkName(containmentName);
    if (child == null) {
        // @ts-ignore
        return fixedCell("<no "+containmentName + ">", ["missing-element"], alternativesProviderForAddingChild(modelNode, containmentName));
    }
    return renderer.renderModelNode(child);
}

function verticalCollectionCell(modelNode: ModelNode, containmentName: string) {
    let ws = wscommunication.getWsCommunication(modelNode.modelName());
    let addInputChild = function() {
        ws.addChild(modelNode, containmentName, 'com.strumenta.financialcalc.Input');
    };
    let children = modelNode.childrenByLinkName(containmentName);
    if (children.length == 0) {
        return h('div.vertical-collection', {}, [
            fixedCell("<< ... >>", ['empty-collection'], function (alternativesUser: any) {
                alternativesUser([{label: "Input", execute: addInputChild}]);
            })]);
    } else {
        return h('div.vertical-collection', {},
            map(modelNode.childrenByLinkName(containmentName), function () {
                // @ts-ignore
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

function map(originalArray: any, op: any) {
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