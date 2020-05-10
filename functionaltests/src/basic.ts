//import {Test} from "./utility";

import {expect} from "chai";
import 'mocha';
import {XMLHttpRequest} from "xmlhttprequest";

const puppeteer = require('puppeteer');
const request = require('request');

function tryToConnect(done, attemptLeft=100) {

    function considerRetrying(attempts) {
        if (attempts > 0) {
            console.log(`sleeping. Attempts left ${attempts - 1}`);
            const delay = require('delay');
            setTimeout(() => {
                tryToConnect(done, attempts - 1);
            }, 10000);
        } else {
            console.log("no more attempt left, failing");
            throw new Error("MPS Server not ready");
        }
    }

    try {
        request('http://localhost:2904/', { json: true }, (err, res, body) => {
            if (err) {
                console.log("Error returned, cannot yet connect");
                considerRetrying(attemptLeft);
            } else {
                if (res.statusCode === 200) {
                    console.log("connected to MPS Server. Can start testing");
                    done();
                } else {
                    console.log("status code", res.statusCode);
                    considerRetrying(attemptLeft);
                }
            }
        });
    } catch (e) {
        console.log("FAILED to connect", e);
        considerRetrying(attemptLeft);
    }
}

describe('WebEditKit integration', () => {

    before(function (done) {
        this.timeout(500000);
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
                await page.screenshot({path: `screenshots/s1.png`});
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
                await page.screenshot({path: `screenshots/s2.png`});
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