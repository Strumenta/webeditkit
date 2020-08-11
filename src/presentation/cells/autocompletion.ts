import autocomplete from 'autocompleter';
import { VNode } from '../../internal';

import { ModelNode } from '../../internal';
import { Alternative, getWsCommunication } from '../../internal';
import {NodeData} from "../../datamodel/misc";

export function alternativesProviderForAbstractConcept(
  modelNode: ModelNode,
  filter: AlternativeFilter = () => true,
): SuggestionsReceiverFactory {
  const parent = modelNode.parent();
  if (parent == null) {
    throw new Error('The given node has no parent');
  }
  const containmentName = modelNode.containmentName();
  if (containmentName == null) {
    throw new Error('The given node has a parent but no containment name');
  }
  return alternativesProviderForAddingChild(parent, containmentName, true, filter);
}

export type SuggestionsReceiverFactory = (suggestionsReceiver: SuggestionsReceiver) => void;
export type AlternativeFilter = (alternative: Alternative, index: number) => boolean;

export function alternativesProviderForAddingChild(
  modelNode: ModelNode,
  containmentName: string,
  replacing = false,
  filter: AlternativeFilter = () => true,
): SuggestionsReceiverFactory {
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
    ws.askAlternatives(modelNode, containmentName, (alternatives) => {
      const adder = (conceptName: string, node?: NodeData) => () => {
        if (replacing) {
          ws.setChild(modelNode, containmentName, conceptName, node);
        } else {
          ws.addChild(modelNode, containmentName, conceptName, node);
        }
      };
      const uiAlternatives = Array.from(
        alternatives.filter(filter).map((alt, index) => {
          return { label: alt.node ? alt.node.name : alt.alias, execute: adder(alt.conceptName, alt.node) };
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

export type AlternativesProvider = (suggestionsReceiver: SuggestionsReceiver) => void;

export function installAutocomplete(
  vnode: VNode,
  valuesProvider: (suggestionsReceiver: SuggestionsReceiver) => void,
  fixed: boolean,
): void {
  const input = vnode.elm as HTMLInputElement;
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
      div.textContent = item.label as string;
      return div;
    },
    fetch: (text: string, update: (suggestions: AutocompleteAlternative[]) => void) => {
      const ltext = text.toLowerCase();
      valuesProvider((suggestions: AutocompleteAlternative[]) => {
        if (!fixed) {
          suggestions = suggestions.filter((n: { label: string }) => n.label.toLowerCase().includes(ltext));
          if (suggestions.length === 1 && suggestions[0].label === text) {
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
      container.style.width = 'auto';
    },
    preventSubmit: true,
  });
}

export function isAutocompleteVisible(): boolean {
  return !!document.querySelector('.autocomplete')?.parentElement;
}
