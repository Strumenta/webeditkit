//const renderer = require('./renderer');
const datamodel = require('./datamodel.js');

function findNode(root, searchedID) {
    if (root.id.regularId == searchedID.regularId) {
        return root;
    } else {
        for (var i=0;i<root.children.length;i++) {
            var res = findNode(root.children[i], searchedID);
            if (res != null) {
                return res;
            }
        }
        return null;
    }
}

class WsCommunication {

    constructor(modelName, localName) {
        this.ws = new WebSocket("ws://localhost:2904/socket");
        this.modelName = modelName;
        this.localName = localName;
        console.log("connected to ws -> ", this.ws);

        this.ws.onopen = function(event) {
            window.wscommunication.registerForChangesInModel(modelName);

        };

        this.ws.onmessage = function(event) {
            console.log("onmessage", event);
            let data = JSON.parse(event.data);
            console.log("  data: ", data);
            if (data.type == "propertyChange") {
                console.log("  window.datamodel: ", window.datamodel);
                console.log("  localName: ", localName);
                let node = findNode(window.datamodel[localName].data, data.nodeId);
                console.log("  node: ", node);
                node.properties[data.propertyName] = data.propertyValue;
                console.log("  changed: ", node);
                renderDataModels();
            } else if (data.type == "nodeAdded") {
                console.log("NODE ADDED");
                let parentNode = findNode(window.datamodel[localName].data, data.parentNodeId);
                console.log("parentNode", parentNode);
                // TODO consider index
                new datamodel.ModelNode(parentNode).addChild(data.relatioName, data.index, data.child);
                renderDataModels();
            } else {
                throw "Unknown change type: " + data.type;
            }
        };
    }

    sendJSON(data) {
        this.ws.send(JSON.stringify(data));
    }

    registerForChangesInModel(modelName) {
        this.sendJSON({
            type: 'registerForChanges',
            modelName: modelName
        });
    }
}

module.exports.WsCommunication = WsCommunication;