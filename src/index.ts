import {
  fixedCell,
  referenceCell,
  horizontalCollectionCell,
  editableCell,
  emptyRow,
  childCell,
  horizontalGroupCell,
  row,
  tabCell,
  verticalCollectionCell,
  verticalGroupCell,
} from './presentation/cells';

import { registerRenderer } from './presentation/renderer';

export {
  fixedCell,
  referenceCell,
  horizontalCollectionCell,
  editableCell,
  emptyRow,
  childCell,
  horizontalGroupCell,
  row,
  tabCell,
  verticalCollectionCell,
  verticalGroupCell,
};

import uiutils = require('./presentation/uiutils');

import { getDefaultBaseUrl, setDefaultBaseUrl, findNode, registerDataModelClass, ModelNode } from './datamodel';
export { getDefaultBaseUrl, setDefaultBaseUrl, findNode, registerDataModelClass, ModelNode };

import { editorController, EditorController, Observer } from './presentation';
export { editorController, EditorController, Observer };

import { getIssuesForNode } from './communication/issues';
export { getIssuesForNode };

import { getNodeFromLocalRepo } from './datamodel';
export { getNodeFromLocalRepo };

import wscommunication = require('./communication/wscommunication');

export { registerRenderer };

export function setup() {
  uiutils.installAutoresize();
}

export function addModel(baseUrl: string, modelName: string, nodeId: string, target: string) {
  const ws = wscommunication.createInstance('ws://' + baseUrl + '/socket', modelName, target);
  loadDataModel('http://' + baseUrl, modelName, nodeId, target);
  // avoid to send message while still in connecting
  setTimeout(() => {
    ws.askForErrorsInNode(modelName, nodeId);
  }, 200);
}

import { renderModelNode } from './presentation/renderer';
export { renderModelNode };

import { init } from 'snabbdom/snabbdom';

import h from 'snabbdom/h'; // helper function for creating vnodes

export { h };

import toVNode from 'snabbdom/tovnode';

import * as sclass from 'snabbdom/modules/class';
import * as sprops from 'snabbdom/modules/props';
import * as sstyle from 'snabbdom/modules/style';
import * as seventlisteners from 'snabbdom/modules/eventlisteners';
import * as sdataset from 'snabbdom/modules/dataset';
import { forEachDataModel, setDatamodelRoot } from './datamodel/registry';
import { dataToNode } from './datamodel';
export { dataToNode };
import { IssuesMap } from './datamodel/issues';
import { VNode } from 'snabbdom/vnode';
import { getIssuesForModel } from './communication/wscommunication';
import {
  wrapInsertHook,
  wrapKeydownHandler,
  wrapKeypressHandler,
  wrapUpdateHook,
} from './presentation/cells/vnodemanipulation';

const patch = init([
  // Init patch function with chosen modules
  sclass.default, // makes it easy to toggle classes
  sprops.default, // for setting properties on DOM elements
  sstyle.default, // handles styling on elements with support for animations
  seventlisteners.default, // attaches event listeners
  sdataset.default,
]);
const vnodes = {};

type BasicCallback = () => void;

function injectErrors(vnode: VNode, issues: IssuesMap): VNode {
  if (vnode == null) {
    return vnode;
  }
  if (vnode.data == null || vnode.children == null) {
    // throw new Error('This does not seem a valid node');
    // this is a piece of text
    return vnode;
  }
  if (vnode.data.dataset != null && vnode.data.dataset.node_represented != null) {
    const myNodeId = vnode.data.dataset.node_represented;
    const errors = issues.getIssuesForNode(myNodeId);
    if (errors.length !== 0) {
      vnode = wrapInsertHook(vnode, (vNode: VNode): any => {
        $(vNode.elm).addClass('hasErrors');
      });
      vnode = wrapUpdateHook(vnode, (oldVNode: VNode, vNode: VNode): any => {
        $(vNode.elm).addClass('hasErrors');
      });
    } else {
      vnode = wrapInsertHook(vnode, (vNode: VNode): any => {
        $(vNode.elm).removeClass('hasErrors');
      });
      vnode = wrapUpdateHook(vnode, (oldVNode: VNode, vNode: VNode): any => {
        $(vNode.elm).removeClass('hasErrors');
      });
    }
  }
  for (let i = 0; i < vnode.children.length; i++) {
    if ((vnode as VNode).children[i] != null) {
      vnode.children[i] = injectErrors(<VNode>vnode.children[i], issues);
    }
  }
  return vnode;
}

export const renderDataModels = (cb?: BasicCallback) => {
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
      [wrapKeypressHandler(injectErrors(renderModelNode(root), issues), (event): boolean=>{
        if (event.key === 'Enter' && event.altKey === true) {
          editorController().triggerIntentionsMenu(event);
          return false;
        } else {
          return true;
        }
      })],
    );
    if (vnodes[name] === undefined) {
      const domNode = $('div#' + name)[0];
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

const targetData: { [key: string]: TargetDataType } = {};

export function loadDataModel(baseUrl: string, model: string, nodeId: string, target: string) {
  targetData[target] = { baseUrl, model, nodeId };
  const nodeURL = baseUrl + '/models/' + model + '/' + nodeId;
  $.getJSON(nodeURL, (data) => {
    const root = dataToNode(data);
    root.injectModelName(model, target);
    setDatamodelRoot(target, root);

    renderDataModels();
  }).fail(() => {
    throw new Error('Failed to load data model, using URL ' + nodeURL);
  });
}

export function baseUrlForTarget(target): string {
  return targetData[target].baseUrl;
}

export function baseUrlForModelName(model: string): string {
  for (const target in targetData) {
    if (targetData[target].model === model) {
      return targetData[target].baseUrl;
    }
  }
  return null;
}
