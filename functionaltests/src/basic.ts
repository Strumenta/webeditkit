//import {Test} from "./utility";

import {expect} from "chai";
import 'mocha';

const puppeteer = require('puppeteer');


describe('WebEditKit integration', () => {
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
                    if (m['name'] == 'com.strumenta.financialcalc.sandbox') {
                        expect(m['uuid']).to.equal('f56d08a3-65f8-447b-bdb0-6e1a85c1e08d');
                        found = true;
                    }
                }
                expect(found).to.equal(true);
                //expect(bodyHTML).to.equal("MPS Server up and running.");
                console.log(bodyHTML);
                console.log(modules);
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