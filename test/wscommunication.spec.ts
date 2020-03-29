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
                done();
            });
        });

        const ws = new WsCommunication('myurl', 'myModelName', 'localName', new WebSocket(fakeURL));
    });

});
