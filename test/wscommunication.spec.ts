import {registerDataModelClass, dataToNode, ModelNode, NodeData, Ref} from '../src/datamodel';
import { expect } from 'chai';
import 'mocha';
import { WebSocket, Server } from 'mock-socket';
import { WsCommunication} from "../src/wscommunication";


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
            done();
        });

        const ws = new WsCommunication('myurl', 'myModelName', 'localName', new WebSocket(fakeURL));
        ws.setSilent();
    });

});
