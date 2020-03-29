import {registerDataModelClass, dataToNode, ModelNode, NodeData, Ref, setDatamodelRoot} from '../src/datamodel';
import { expect } from 'chai';
import 'mocha';
import { WebSocket, Server } from 'mock-socket';
import { WsCommunication} from "../src/wscommunication";
import {renderDataModels} from "../src/webeditkit";

const rootData1 = {
    "children": [
        {
            "containingLink": "inputs",
            "children": [
                {
                    "containingLink": "type",
                    "children": [],
                    "properties": {},
                    "refs": {},
                    "id": {
                        "regularId": "1848360241685547702"
                    },
                    "concept": "com.strumenta.financialcalc.BooleanType",
                    "abstractConcept": false
                }
            ],
            "properties": {
                "name": "a"
            },
            "refs": {},
            "id": {
                "regularId": "1848360241685547698"
            },
            "name": "a",
            "concept": "com.strumenta.financialcalc.Input",
            "abstractConcept": false
        },
        {
            "containingLink": "inputs",
            "children": [
                {
                    "containingLink": "type",
                    "children": [],
                    "properties": {},
                    "refs": {},
                    "id": {
                        "regularId": "1848360241685547711"
                    },
                    "concept": "com.strumenta.financialcalc.StringType",
                    "abstractConcept": false
                }
            ],
            "properties": {
                "name": "b"
            },
            "refs": {},
            "id": {
                "regularId": "1848360241685547705"
            },
            "name": "b",
            "concept": "com.strumenta.financialcalc.Input",
            "abstractConcept": false
        }
    ],
    "properties": {
        "name": "My calculations"
    },
    "refs": {},
    "id": {
        "regularId": "324292001770075100"
    },
    "name": "My calculations",
    "concept": "com.strumenta.financialcalc.FinancialCalcSheet",
    "abstractConcept": false
};

function clone(original) {
    return JSON.parse(JSON.stringify(original));
}

describe('WsCommunication', () => {

    it('should register for changes on start', (done) => {
        const fakeURL = 'ws://localhost:8080';
        const mockServer = new Server(fakeURL);

        mockServer.on('connection', socket => {
            socket.on('message', data => {
                expect(JSON.parse(data as string)).to.eql({type:'registerForChanges',modelName:'myModelName'});
                mockServer.close();
                done();
            });
        });

        const ws = new WsCommunication('myurl', 'myModelName', 'localName', new WebSocket(fakeURL));
    });

    it('should throw error for unknown messages', (done) => {
        const fakeURL = 'ws://localhost:8080';
        const mockServer = new Server(fakeURL);

        mockServer.on('connection', socket => {
            socket.on('message', data => {
                expect(JSON.parse(data as string)).to.eql({type:'registerForChanges',modelName:'myModelName'});
            });
            expect(()=>{socket.send(JSON.stringify({type: 'unknownMessageType'}))}).to.throw('Unknown message type: unknownMessageType');
            mockServer.close();
            done();
        });

        const ws = new WsCommunication('myurl', 'myModelName', 'localName', new WebSocket(fakeURL));
        ws.setSilent();
    });

    it('should support instantiate', (done) => {
        const fakeURL = 'ws://localhost:8080';
        const mockServer = new Server(fakeURL);

        const messagesReceivedByServer = [];

        mockServer.on('connection', socket => {
            socket.on('message', data => {
                messagesReceivedByServer.push(JSON.parse(data as string));
                if (messagesReceivedByServer.length == 2) {
                    expect(messagesReceivedByServer[0]).to.eql({
                        type: 'instantiateConcept',
                        modelName: 'my.qualified.ModelName',
                        conceptToInstantiate: 'myConcept',
                        nodeToReplace: '1848360241685547698'
                    });
                    expect(messagesReceivedByServer[1]).to.eql({type:'registerForChanges',modelName:'my.qualified.ModelName'});
                    mockServer.close();
                    done();
                }
            });
        });

        const ws = new WsCommunication('myurl', 'my.qualified.ModelName', 'localName', new WebSocket(fakeURL));
        ws.setSilent();
        const root = dataToNode(clone(rootData1));
        root.injectModelName('my.qualified.ModelName', 'myRoot');
        const n_a = root.findNodeById('1848360241685547698');
        ws.instantiate('myConcept', n_a);
    });

    it('should react to property change by updating the property - on root', (done) => {
        const fakeURL = 'ws://localhost:8080';
        const mockServer = new Server(fakeURL);

        mockServer.on('connection', socket => {
            socket.on('message', data => {
                expect(JSON.parse(data as string)).to.eql({type:'registerForChanges',modelName:'myModelName'});
            });
            socket.send(JSON.stringify({
                type: 'propertyChange',
                nodeId: { regularId: '324292001770075100'},
                propertyName: 'name',
                propertyValue: 'My Shiny New Name'
            }));
            expect(root.name()).to.equals('My Shiny New Name');
            mockServer.close();
            done();
        });

        const root = dataToNode(clone(rootData1));
        root.injectModelName('my.qualified.ModelName', 'myRoot');
        setDatamodelRoot('localName', root);

        const ws = new WsCommunication('myurl', 'myModelName', 'localName', new WebSocket(fakeURL));
        ws.setSilent();
    });

});
