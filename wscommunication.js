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

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

class WsCommunication {

    constructor(modelName, localName) {
        this.ws = new WebSocket("ws://localhost:2904/socket");
        this.modelName = modelName;
        this.localName = localName;
        this.callbacks = {};

        let thisWS = this;

        this.ws.onopen = function(event) {
            thisWS.registerForChangesInModel(modelName);
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
            } else if (data.type == "nodeRemoved") {
                console.log("NODE REMOVED");
                let parentNode = findNode(window.datamodel[localName].data, data.parentNodeId);
                console.log("parentNode", parentNode);
                // TODO consider index
                new datamodel.ModelNode(parentNode).removeChild(data.relatioName, data.child);
                renderDataModels();
            } else if (data.type == "AnswerAlternatives") {
                let alternativesReceiver = thisWS.callbacks[data.requestId];
                alternativesReceiver(data.items);
            } else {
                console.log("data", data);
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

    instantiate(conceptName, nodeToReplace) {
        this.sendJSON({
            type: 'instantiateConcept',
            modelName: nodeToReplace.modelName(),
            conceptToInstantiate: conceptName,
            nodeToReplace: nodeToReplace.idString()
        });
    }

    addChild(container, containmentName, conceptName) {
        this.sendJSON({
            type: 'addChild',
            modelName: container.modelName(),
            container: container.idString(),
            containmentName: containmentName,
            conceptToInstantiate: conceptName
        });
    }

    triggerChangeOnPropertyNode(modelNode, propertyName, propertyValue) {
        window.wscommunication.sendJSON({
            type: "propertyChange",
            nodeId: modelNode.idString(),
            modelName: modelNode.modelName(),
            propertyName: propertyName,
            propertyValue: propertyValue
        });
    }

    askAlternatives(modelNode, containmentName, alternativesReceiver) {
        // we generate a UUID and ask the server to answer us using such UUID
        let uuid = uuidv4();
        this.callbacks[uuid] = alternativesReceiver;
        window.wscommunication.sendJSON({
            type: "askAlternatives",
            requestId: uuid,
            modelName: modelNode.modelName(),
            nodeId: modelNode.idString(),
            containmentName: containmentName
        });
    }
}

module.exports.WsCommunication = WsCommunication;