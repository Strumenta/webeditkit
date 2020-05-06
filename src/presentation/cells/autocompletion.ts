import {ModelNode} from "../../datamodel";
import {getWsCommunication} from "../../communication";
import {Alternative} from "../../communication/wscommunication";

const autocomplete = require('autocompleter');

export function alternativesProviderForAbstractConcept(modelNode: ModelNode) {
    const parent = modelNode.parent();
    if (parent == null) {
        throw new Error('The given node has no parent');
    }
    return alternativesProviderForAddingChild(parent, modelNode.containmentName(), true);
}

type SuggestionsReceiverFactory = (suggestionsReceiver: SuggestionsReceiver) => void;

export function alternativesProviderForAddingChild(
    modelNode: ModelNode,
    containmentName: string,
    replacing: boolean = false,
): SuggestionsReceiverFactory {
    if (modelNode == null) {
        throw new Error('modelNode should not be null');
    }
    // we should get all the alternatives from the server
    return (suggestionsReceiver: SuggestionsReceiver) => {
        const modelName = modelNode.modelName();
        if (modelName == null) {
            throw new Error('The received node has not model name');
        }
        const ws = getWsCommunication(modelName);
        if (ws == null) {
            throw new Error('No WsCommunication registered for model ' + modelNode.modelName());
        }
        ws.askAlternatives(modelNode, containmentName, (alternatives: any) => {
            const adder = (conceptName: string) => () => {
                if (replacing) {
                    ws.setChild(modelNode, containmentName, conceptName);
                } else {
                    ws.addChild(modelNode, containmentName, conceptName);
                }
            };
            const uiAlternatives = Array.from(
                $(alternatives).map((index, domElement: Alternative) => {
                    return { label: domElement.alias, execute: adder(domElement.conceptName) };
                }),
            );
            suggestionsReceiver(uiAlternatives);
        });
    };
}

export interface AutocompleteAlternative {
    label: string;
    execute: () => void;
}

export type SuggestionsReceiver = (suggestions: AutocompleteAlternative[]) => void;

export function installAutocomplete(
    vnode: any,
    valuesProvider: (suggestionsReceiver: SuggestionsReceiver) => void,
    fixed: boolean,
) {
    const input = vnode.elm;
    const ac = autocomplete({
        input,
        minLength: 0,
        render: (item: any, currentValue: any) => {
            const div = document.createElement('div');
            if (item.highlighted) {
                div.className = 'autocomplete-item highlighted';
            } else {
                div.className = 'autocomplete-item';
            }
            div.textContent = item.label;
            return div;
        },
        fetch: (text: string, update: any) => {
            const ltext = text.toLowerCase();
            valuesProvider((suggestions: AutocompleteAlternative[]) => {
                if (!fixed) {
                    suggestions = suggestions.filter((n: { label: string }) => n.label.toLowerCase().includes(ltext));
                    console.log("suggestions", suggestions, text);
                    if (suggestions.length == 1 && suggestions[0].label == text) {
                        suggestions[0].execute();
                    }
                }
                update(suggestions);
            });
        },
        onSelect: (item: AutocompleteAlternative) => {
            item.execute();
        },
        customize: (_input: any, inputRect: any, container: any, maxHeight: any) => {
            // not true in tests
            $(container).css('width', 'auto');
        },
        preventSubmit: true
    });
}

export function isAutocompleteVisible() {
    const res = $(".autocomplete").parent().length > 0;
    console.log("isAutocompleteVisible", res);
    return res;
}
