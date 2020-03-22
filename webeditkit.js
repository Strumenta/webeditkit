const datamodel = require('./datamodel.js');

const renderers = require('./renderer');
const registerRenderer = renderers.registerRenderer;
const renderModelNode = renderers.renderModelNode;

var snabbdom = require('snabbdom/snabbdom');
var patch = snabbdom.init([ // Init patch function with chosen modules
    require('snabbdom/modules/class').default, // makes it easy to toggle classes
    require('snabbdom/modules/props').default, // for setting properties on DOM elements
    require('snabbdom/modules/style').default, // handles styling on elements with support for animations
    require('snabbdom/modules/eventlisteners').default, // attaches event listeners
]);
var h = require('snabbdom/h').default; // helper function for creating vnodes
const toVNode = require('snabbdom/tovnode').default;

renderDataModels = function() {
    datamodel.forEachDataModel(function(name, root) {
        //let renderFunctionName = "render_" + name;
        //let renderFunction = window[renderFunctionName];
        let vnode = h('div#' + name + '.editor', {}, [renderModelNode(root)]);
        if (window.vnodes == undefined) {
            window.vnodes = {};
        }
        if (window.vnodes[name] == undefined) {
            window.vnodes[name] = toVNode($("div#"+name)[0]);
        }
        window.vnodes[name] = patch(window.vnodes[name], vnode);
    });
};

function loadDataModel(baseUrl, model, nodeId, target) {
    let nodeURL = baseUrl + "/models/" + model + "/" + nodeId;
    $.getJSON(nodeURL, function(data) {
        let root = datamodel.dataToNode(data);
        root.injectModelName(model);
        datamodel.setDatamodelRoot(target, root);

        renderDataModels();
    });
}

module.exports.renderDataModels = renderDataModels;
module.exports.loadDataModel = loadDataModel;