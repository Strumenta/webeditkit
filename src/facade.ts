import { init } from 'snabbdom';
import * as sclass from 'snabbdom/modules/class';
import * as sprops from 'snabbdom/modules/props';
import * as sstyle from 'snabbdom/modules/style';
import * as seventlisteners from 'snabbdom/modules/eventlisteners';
import * as sdataset from 'snabbdom/modules/dataset';
import { toVNode, h, VNode } from './internal';

import * as wscommunication from './internal';
import { dataToNode, editorController, ModelNode, renderModelNode } from './internal';
import { IssuesMap } from './internal';
import { wrapInsertHook, wrapUpdateHook } from './internal';
import { forEachDataModel, setDatamodelRoot } from './internal';
import { getIssuesForModel } from './internal';
import { wrapKeypressHandler } from './internal';
import { NodeData } from './internal';

export function setup(): void {
  // No setup necessary for now, but it's useful to keep an init point
}

export function addModel(baseUrl: string, modelName: string, nodeId: string, target: string): Promise<ModelNode> {
  const ws = wscommunication.createInstance('ws://' + baseUrl + '/socket', modelName, target);
  const p: Promise<ModelNode> = loadDataModel('http://' + baseUrl, modelName, nodeId, target).catch((e) => {
    console.error(e);
    // TODO Alessio check here - where is it throwing? Is it intended?
    throw new Error('Failed to load data model, base URL ' + baseUrl);
  });
  // avoid to send message while still in connecting
  setTimeout(() => {
    ws.askForErrorsInNode(modelName, nodeId);
  }, 200);
  return p;
}

export const patch = init([sclass.default, sprops.default, sstyle.default, seventlisteners.default, sdataset.default]);
const vnodes: { [name: string]: VNode } = {};

type BasicCallback = () => void;

function injectErrors(vnode: VNode, issues: IssuesMap): VNode {
  if (vnode.data == null) {
    // throw new Error('This does not seem a valid node');
    // this is a piece of text
    return vnode;
  }
  if (vnode.data.dataset != null && vnode.data.dataset.node_represented != null) {
    const myNodeId = vnode.data.dataset.node_represented;
    const errors = issues.getIssuesForNode(myNodeId);
    if (errors.length !== 0) {
      vnode = wrapInsertHook(vnode, (vNode: VNode): any => {
        if (vNode.elm != null) {
          (vNode.elm as Element).classList.add('hasErrors');
        }
      });
      vnode = wrapUpdateHook(vnode, (oldVNode: VNode, vNode: VNode): any => {
        if (vNode.elm != null) {
          (vNode.elm as Element).classList.add('hasErrors');
        }
      });
    } else {
      vnode = wrapInsertHook(vnode, (vNode: VNode): any => {
        if (vNode.elm != null) {
          (vNode.elm as Element).classList.remove('hasErrors');
        }
      });
      vnode = wrapUpdateHook(vnode, (oldVNode: VNode, vNode: VNode): any => {
        if (vNode.elm != null) {
          (vNode.elm as Element).classList.remove('hasErrors');
        }
      });
    }
  }

  const children = vnode.children;
  if (children != null) {
    for (let i = 0; i < children.length; i++) {
      if (typeof children[i] !== 'string') {
        children[i] = injectErrors(children[i] as VNode, issues);
      }
    }
  }
  return vnode;
}

export const renderDataModels = (cb?: BasicCallback): void => {
  if (typeof window === 'undefined') {
    console.log('skipping renderDataModels in Node.JS');
    return;
  }
  forEachDataModel((name, root: ModelNode) => {
    const issues = getIssuesForModel(root.modelName());
    const vnode = h(
      'div#' + name + '.editor',
      {
        dataset: { model_local_name: name },
      },
      [
        wrapKeypressHandler(injectErrors(renderModelNode(root), issues), (event): boolean => {
          if (event.key === 'Enter' && event.altKey === true) {
            void editorController().triggerIntentionsMenu(event);
            return false;
          } else {
            return true;
          }
        }),
      ],
    );
    if (vnodes[name] === undefined) {
      const domNode = document.getElementById(name);
      if (domNode == null) {
        console.warn(`cannot render model on div#${name}`);
        return;
      }
      vnodes[name] = toVNode(domNode);
    }
    vnodes[name] = patch(vnodes[name], vnode);
  });
  if (cb != null) {
    cb();
  }
};

///
/// Model Registry
///

interface TargetDataType {
  baseUrl: string;
  model: string;
  nodeId: string;
}

const targetData: { [target: string]: TargetDataType } = {};

export function loadDataModel(baseUrl: string, model: string, nodeId: string, target: string): Promise<ModelNode> {
  targetData[target] = { baseUrl, model, nodeId };
  const nodeURL = baseUrl + '/models/' + model + '/' + nodeId;
  return fetch(nodeURL)
    .then((response) => response.json())
    .then((data) => {
      const root = dataToNode(data.value as NodeData);
      root.injectModelName(model, target);

      setDatamodelRoot(target, root);

      renderDataModels();
      return root;
    });
}

export function baseUrlForTarget(target: string): string {
  return targetData[target].baseUrl;
}

export function baseUrlForModelName(model: string): string | undefined {
  for (const target in targetData) {
    if (targetData[target].model === model) {
      return targetData[target].baseUrl;
    }
  }
  return undefined;
}
