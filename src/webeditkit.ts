import { renderModelNode } from './renderer';

import { dataToNode, forEachDataModel, setDatamodelRoot } from './datamodel';

import { init } from 'snabbdom/snabbdom';

import h from 'snabbdom/h'; // helper function for creating vnodes

import toVNode from 'snabbdom/tovnode';

import * as sclass from 'snabbdom/modules/class';
import * as sprops from 'snabbdom/modules/props';
import * as sstyle from 'snabbdom/modules/style';
import * as seventlisteners from 'snabbdom/modules/eventlisteners';
import * as sdataset from 'snabbdom/modules/dataset';

const patch = init([
  // Init patch function with chosen modules
  sclass.default, // makes it easy to toggle classes
  sprops.default, // for setting properties on DOM elements
  sstyle.default, // handles styling on elements with support for animations
  seventlisteners.default, // attaches event listeners
  sdataset.default,
]);
const vnodes = {};

export const renderDataModels = () => {
  forEachDataModel((name, root) => {
    const vnode = h('div#' + name + '.editor', {}, [renderModelNode(root)]);
    if (vnodes[name] === undefined) {
      vnodes[name] = toVNode($('div#' + name)[0]);
    }
    vnodes[name] = patch(vnodes[name], vnode);
  });
};

interface TargetDataType {
  baseUrl: string;
  model: string;
  nodeId: string;
}

const targetData : {[key:string]: TargetDataType } = {};

function loadDataModel(baseUrl: string, model: string, nodeId: string, target: string) {
  targetData[target] = {baseUrl, model, nodeId};
  const nodeURL = baseUrl + '/models/' + model + '/' + nodeId;
  $.getJSON(nodeURL, (data) => {
    const root = dataToNode(data);
    root.injectModelName(model, target);
    setDatamodelRoot(target, root);

    renderDataModels();
  });
}

export function baseUrlForTarget(target) : string {
  return targetData[target].baseUrl;
}

export function baseUrlForModelName(model: string) : string {
  for (let target in targetData) {
    if (targetData[target].model === model) {
      return targetData[target].baseUrl;
    }
  }
  return null;
}

module.exports.renderDataModels = renderDataModels;
module.exports.loadDataModel = loadDataModel;
module.exports.h = h;
