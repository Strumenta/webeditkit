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

import {
  registerRenderer
} from "./presentation/renderer";

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

//export const h = require('snabbdom/h').default; // helper function for creating vnodes
const uiutils = require('./presentation/uiutils');
export const datamodel = require('./datamodel/misc');
const wscommunication = require('./communication/wscommunication');
export const cells = require('./presentation/cells');

const renderers = require('./presentation/renderer');

export {
  registerRenderer
}

export const registerDataModelClass = datamodel.registerDataModelClass;

export const findNode = datamodel.findNode;

export function setup() {
  uiutils.installAutoresize();
}

export function addModel(baseUrl: string, modelName: string, nodeId, target: string) {
  wscommunication.createInstance('ws://' + baseUrl + '/socket', modelName, target);
  loadDataModel('http://' + baseUrl, modelName, nodeId, target);
}

// TODO move to index

import { renderModelNode } from './presentation/renderer';

//import { dataToNode, forEachDataModel, setDatamodelRoot } from './datamodel/misc';

import { init } from 'snabbdom/snabbdom';

import h from 'snabbdom/h'; // helper function for creating vnodes

import toVNode from 'snabbdom/tovnode';

import * as sclass from 'snabbdom/modules/class';
import * as sprops from 'snabbdom/modules/props';
import * as sstyle from 'snabbdom/modules/style';
import * as seventlisteners from 'snabbdom/modules/eventlisteners';
import * as sdataset from 'snabbdom/modules/dataset';
import {dataToNode, forEachDataModel, setDatamodelRoot} from "./datamodel/registry";
import {VNode} from "snabbdom/vnode";
import {getIssuesForModel, IssuesMap} from "./communication/wscommunication";
import {ModelNode} from "./datamodel/modelNode";
import {IssueDescription} from "./communication/messages";

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

function injectErrors(vnode: VNode, issues: IssuesMap) : VNode {
  //console.log("ISSUES ", issues, vnode);
  if (vnode.data.dataset != null && vnode.data.dataset.node_represented != null) {
    const myNodeId = vnode.data.dataset.node_represented;
    console.log("My node id", myNodeId);
    const errors = issues.getIssuesForNode(myNodeId);
    if (errors.length != 0) {
      console.log("should inject errors", errors, vnode);
      vnode.sel = vnode.sel + ".hasErrors";
    }
  }
  for (let i=0;i<vnode.children.length;i++) {
    if (<VNode>(vnode.children[i]) != null) {
      vnode.children[i] = injectErrors(<VNode>(vnode.children[i]), issues);
    }
  }
  return vnode
}

export const renderDataModels = (cb?: BasicCallback) => {
  if (typeof window === 'undefined') {
    console.log('skipping renderDataModels in Node.JS');
    return;
  }
  forEachDataModel((name, root: ModelNode) => {
    const issues = getIssuesForModel(root.modelName());
    console.log("issues", issues);
    const vnode = h('div#' + name + '.editor', {}, [injectErrors(renderModelNode(root), issues)]);
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

module.exports.h = h;
