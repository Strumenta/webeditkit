import { ModelNode } from '../../datamodel';
import { Alternative, getWsCommunication } from '../../communication/wscommunication';
import autocomplete from 'autocompleter';
import { VNode } from 'snabbdom/vnode';

export function alternativesProviderForAbstractConcept(modelNode: ModelNode): SuggestionsReceiverFactory {
  const parent = modelNode.parent();
  if (parent == null) {
    throw new Error('The given node has no parent');
  }
  const containmentName = modelNode.containmentName();
  if (containmentName == null) {
    throw new Error('The given node has a parent but no containment name');
  }
  return alternativesProviderForAddingChild(parent, containmentName, true);
}

type SuggestionsReceiverFactory = (suggestionsReceiver: SuggestionsReceiver) => void;

export function alternativesProviderForAddingChild(
  modelNode: ModelNode,
  containmentName: string,
  replacing = false,
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
      $(container).css('width', 'auto');
    },
    preventSubmit: true,
  });
}

export function isAutocompleteVisible(): boolean {
  const res = $('.autocomplete').parent().length > 0;
  return res;
}
