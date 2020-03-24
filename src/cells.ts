import {ModelNode} from "./datamodel";

import h, {VNodeChildElement} from "snabbdom/h"; // helper function for creating vnodes

import {renderModelNode} from "./renderer";

import {myAutoresizeOptions} from "./uiutils";

import {getWsCommunication, WsCommunication} from "./wscommunication";

import {isAtEnd, moveToNextElement} from "./navigation";

const autocomplete = require("autocompleter");

export function alternativesProviderForAbstractConcept(modelNode: ModelNode) {
    return alternativesProviderForAddingChild(modelNode.parent(), modelNode.containmentName(), true);
}

function alternativesProviderForAddingChild(modelNode: ModelNode, containmentName: string, replacing: boolean) {
    if (replacing === undefined) {
        replacing = false;
    }
    // we should get all the alternatives from the server
    return (alternativesUser: any) => {
        const ws = getWsCommunication(modelNode.modelName());
        ws.askAlternatives(modelNode, containmentName, (alternatives: any) => {
            const adder = (conceptName: string) => () => {
                if (replacing) {
                    ws.setChild(modelNode, containmentName, conceptName);
                } else {
                    ws.addChild(modelNode, containmentName, conceptName);
                }
            };
            const uiAlternatives = Array.from($(alternatives).map(() => {
                return {label: this.alias, execute: adder(this.conceptName)}
            }));
            alternativesUser(uiAlternatives);
        });
    };
}

function installAutocomplete(vnode: any, valuesProvider: any, fixed: boolean) {
    const input = vnode.elm;
    autocomplete({
        input,
        minLength: 0,
        render: (item: any, currentValue: any) => {
            const div = document.createElement("div");
            div.className = "autocomplete-item";
            div.textContent = item.label;
            return div;
        },
        fetch: (text: string, update: any) => {
            text = text.toLowerCase();
            valuesProvider((suggestions: any) => {
                if (!fixed) {
                    suggestions = suggestions.filter((n: { label: string; }) => n.label.toLowerCase().startsWith(text));
                }
                update(suggestions);
            });
        },
        onSelect: (item: any) => {
            item.execute();
        },
        customize: (_input: any, inputRect: any, container: any, maxHeight: any) => {
            $(container).css('width', 'auto');
        }
    });
}

export function editableCell(modelNode: ModelNode, propertyName: string, extraClasses: string[]) {
    const placeholder = "<no " + propertyName + ">";
    if (modelNode === undefined) {
        throw new Error("modelNode should not be undefined");
    }
    extraClasses = extraClasses || [];
    let extraClassesStr = "";
    if (extraClasses.length > 0) {
        extraClassesStr = "." + extraClasses.join(".");
    }
    const ws = getWsCommunication(modelNode.modelName());
    return h("input.editable" + extraClassesStr, {
        props: {
            value: modelNode.property(propertyName),
            placeholder,
            required: true
        },
        hook: {insert: addAutoresize, update: triggerResize},
        on: {
            keydown: (e: KeyboardEvent) => {
                if (isAtEnd(e.target) && e.key === 'ArrowRight') {
                    moveToNextElement(e.target);
                    e.preventDefault();
                    return true;
                }
            },
            keyup: (e: KeyboardEvent) => {
                ws.triggerChangeOnPropertyNode(modelNode, propertyName, $(e.target).val());
            }
        }
    }, [])
}

function addAutoresize(vnode: any) {
    // @ts-ignore
    $(vnode.elm).autoresize(myAutoresizeOptions);
}

function triggerResize(vnode: any) {
    // @ts-ignore
    $(vnode.elm).inputWidthUpdate(myAutoresizeOptions);
}

export function fixedCell(text: string, extraClasses?: string[], alternativesProvider?: any, deleter?: any) {
    extraClasses = extraClasses || [];
    let extraClassesStr = "";
    if (extraClasses.length > 0) {
        extraClassesStr = "." + extraClasses.join(".");
    }
    return h("input.fixed" + extraClassesStr, {
        props: {value: text},
        hook: {
            insert: (vnode: any) => {
                addAutoresize(vnode);
                if (alternativesProvider != null && alternativesProvider != undefined) {
                    installAutocomplete(vnode, alternativesProvider, true);
                }
            },
            update: triggerResize
        },
        on: {
            keydown: function (e: KeyboardEvent) {
                if (e.key == "ArrowRight") {
                    moveToNextElement(e.target);
                } else if (e.key == "Backspace") {
                    if (deleter != undefined) {
                        deleter();
                    }
                }
                //console.log("fixed: ", e.key);
                e.preventDefault();
                return false;
            }
        }
    }, []);
}

export function row() {
    return h("div.row", {}, flattenArray(arguments));
}

export function emptyRow() {
    return row();
}

export function tabCell() {
    return h("div.tab", {}, []);
}

function flattenArray(value: any) {
    // @ts-ignore
    return Array.from(value).flat();
}

export function childCell(modelNode: ModelNode, containmentName: string) {
    let child = modelNode.childByLinkName(containmentName);
    if (child == null) {
        // @ts-ignore
        return fixedCell("<no " + containmentName + ">", ["missing-element"], alternativesProviderForAddingChild(modelNode, containmentName));
    }
    return renderModelNode(child);
}

export function verticalCollectionCell(modelNode: ModelNode, containmentName: string) {
    let ws = getWsCommunication(modelNode.modelName());
    let addInputChild = function () {
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
                return row(renderModelNode(this));
            }));
    }
}

export function horizontalGroupCell() {
    return h('div.horizontal-group', {}, flattenArray(arguments));
}

export function verticalGroupCell() {
    return h('div.vertical-group', {}, flattenArray(arguments));
}

function map(originalArray: any, op: any) : VNodeChildElement[] {
    return Array.from($(originalArray).map(op));
}
