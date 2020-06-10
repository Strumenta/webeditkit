
import {expect} from "chai";
import 'mocha';
import {XMLHttpRequest} from "xmlhttprequest";
import { MPSSERVER_PORT, tryToConnect } from './utils';
import { createInstance, getWsCommunication } from '../../src/communication';

const puppeteer = require('puppeteer');
const request = require('request');

import { WebSocket } from 'mock-socket';

describe('Intentions API', () => {

    before(function (done) {
        this.timeout(500000);
        console.log("waiting for server to be up");

        tryToConnect(done);

    });

    it('get intentions', async (done) => {
        console.log("A");
        const ws = new WebSocket(`ws://localhost:${MPSSERVER_PORT}/socket`);
        console.log("A2");
        const wsc = createInstance(`ws://localhost:${MPSSERVER_PORT}/socket`, 'ExampleLanguage.sandbox', 'foo',
          ws);
        console.log("A3");
        const intentions = await wsc.getIntentions({
            model: 'ExampleLanguage.sandbox',
            id: {
                regularId: '7467535778008416706'
            }
        });
        console.log(intentions);
        done()
    });
});