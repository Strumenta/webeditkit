//import {Test} from "./utility";

import {expect} from "chai";
import 'mocha';
import {XMLHttpRequest} from "xmlhttprequest";

const puppeteer = require('puppeteer');
const request = require('request');

function tryToConnect(done, attemptLeft=10) {
    try {
        request('http://localhost:2904/', { json: true }, (err, res, body) => {
            if (err) {
                console.log(err);
                throw new Error("Problem");
            }
            if (res.statusCode === 200) {
                done();
            } else {
                console.log("status code", res.statusCode);
                throw new Error("Problem");
            }
        });
    } catch (e) {
        console.log("FAILED to connect", e);
        if (attemptLeft > 0) {
            console.log("sleeping");
            const delay = require('delay');
            setTimeout(() => {
                tryToConnect(done, attemptLeft - 1);
            }, 5000);
        } else {
            console.log("no more attempt left, failing");
            throw new Error("MPS Server not ready");
        }
    }
}

describe('WebEditKit integration', () => {

    before((done) => {
        console.log("waiting for server to be up");

        tryToConnect(done);

        //done();
    });

    it('mpsserver is accessible', (done) => {
        (async () => {
            const browser = await puppeteer.launch();
            try {
                const page = await browser.newPage();
                await page.on('response', (response) => {
                    if (response.status() != 200) {
                        throw new Error("Not 200");
                    }
                });
                await page.on('console', message =>
                    console.log(`  (browser) ${message.type().substr(0, 3).toUpperCase()} ${message.text()}`));
                await page.goto('http://localhost:2904/');
                await page.screenshot({path: `s1.png`});
                let bodyHTML = await page.evaluate(() => document.body.innerHTML);
                expect(bodyHTML).to.equal("MPS Server up and running.");
            } catch (e) {
                console.log("exception captured", e);
                process.exit(1);
            } finally {
                console.log("[Closing browser]");
                await browser.close();
                done();
            }
        })();
    });
    it('modules are listed', (done) => {
        (async () => {
            const browser = await puppeteer.launch();
            try {
                const page = await browser.newPage();
                await page.on('response', (response) => {
                    if (response.status() != 200) {
                        throw new Error("Not 200");
                    }
                });
                await page.on('console', message =>
                    console.log(`  (browser) ${message.type().substr(0, 3).toUpperCase()} ${message.text()}`));
                await page.goto('http://localhost:2904/modules');
                await page.screenshot({path: `s2.png`});
                let bodyHTML = await page.evaluate(() => document.body.innerHTML);
                const modules = JSON.parse(bodyHTML);
                let found = false;
                for (const m of modules) {
                    if (m['name'] == 'com.strumenta.businessorg.sandbox') {
                        expect(m['uuid']).to.equal('304d28bd-2c3c-4fbd-b987-dbce2813a938');
                        found = true;
                    }
                }
                expect(found).to.equal(true);
                //expect(bodyHTML).to.equal("MPS Server up and running.");
                //console.log(bodyHTML);
                //console.log(modules);
            } catch (e) {
                console.log("exception captured", e);
                process.exit(1);
            } finally {
                console.log("[Closing browser]");
                await browser.close();
                done();
            }
        })();
    });
});