
import {expect} from "chai";
import 'mocha';
import {XMLHttpRequest} from "xmlhttprequest";
import { MPSSERVER_PORT, tryToConnect } from './utils';
import { createInstance, getWsCommunication } from '../../src/communication';

var W3CWebSocket = require('websocket').w3cwebsocket;

describe('Intentions API', () => {

    before(function (done) {
        this.timeout(500000);
        console.log("waiting for server to be up");

        tryToConnect(done);

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
});