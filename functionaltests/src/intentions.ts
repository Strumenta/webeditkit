
import {expect} from "chai";
import 'mocha';
import {XMLHttpRequest} from "xmlhttprequest";
import { MPSSERVER_PORT, reloadAll, tryToConnect } from './utils';
import { createInstance, getWsCommunication } from '../../src/communication';
import { GetNode, GetNodeAnswer } from '../../src/communication/messages';
import * as delay from 'delay';

var W3CWebSocket = require('websocket').w3cwebsocket;

describe('Intentions API', () => {

    before(function (done) {
        this.timeout(500000);
        console.log("waiting for server to be up");

        tryToConnect(done);

    });

    beforeEach(async () => {
        // @ts-ignore
        global.WebSocket = W3CWebSocket;
        await reloadAll();
    });

    afterEach(async () => {
        // @ts-ignore
        delete global.WebSocket;
        await reloadAll();
    });

    it('get intentions', (done) => {
        const ws  = new W3CWebSocket(`ws://localhost:${MPSSERVER_PORT}/socket`);
        // tslint:disable-next-line:only-arrow-functions
        ws.onopen = function() {
            const wsc = createInstance(`ws://localhost:${MPSSERVER_PORT}/socket`, 'ExampleLanguage.sandbox', 'foo',
              ws);
            const intentions = wsc.getIntentions({
                model: 'ExampleLanguage.sandbox',
                id: {
                    regularId: '7467535778008416706'
                }
            });
            intentions.then((value) => {
                try {
                    expect(value.length).to.eql(1);
                    expect(value[0].index).to.eql(0);
                    expect(value[0].description).to.eql('Assign Standard ID to All Projects');
                    done();
                } catch (e) {
                    done(e);
                }
            })

        }
    });

    // it('execute intention', (done) => {
    //
    //     // 1) Check initial name of project
    //     // 2) Call intention
    //     // 3) Verify final name of project
    //
    //     const ws  = new W3CWebSocket(`ws://localhost:${MPSSERVER_PORT}/socket`);
    //     const nodeIdForProject1 = {
    //         model: 'ExampleLanguage.sandbox',
    //         id: {
    //             regularId: '7467535778008417157'
    //         }
    //     };
    //     const nodeIdForClient = {
    //         model: 'ExampleLanguage.sandbox',
    //         id: {
    //             regularId: '7467535778008416706'
    //         }
    //     };
    //     // tslint:disable-next-line:only-arrow-functions
    //     ws.onopen = async function() {
    //         const wsc = createInstance(`ws://localhost:${MPSSERVER_PORT}/socket`, 'ExampleLanguage.sandbox', 'foo',
    //           ws);
    //         const nodeData1 = await wsc.getNodeData(nodeIdForProject1);
    //         expect(nodeData1.properties.id).eql('ACME-1');
    //         const intentions = await wsc.getIntentions(nodeIdForClient);
    //         expect(intentions.length).to.eql(1);
    //         expect(intentions[0].index).to.eql(0);
    //         expect(intentions[0].description).to.eql('Assign Standard ID to All Projects');
    //         intentions[0].execute();
    //         delay(400);
    //         const nodeData2 = await wsc.getNodeData(nodeIdForProject1);
    //         expect(nodeData2.properties.id).eql('ACBU');
    //         done();
    //     }
    // });
});