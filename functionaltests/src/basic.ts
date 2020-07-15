import { expect } from 'chai';
import 'mocha';
import { MPSSERVER_PORT, reloadAll, tryToConnect } from './utils';
import { Browser, Page } from 'puppeteer';

import puppeteer from 'puppeteer';
import { ModuleInfo } from '../../src/communication/httpcommunication';

describe('WebEditKit integration', () => {
  before(function (done) {
    this.timeout(500000);
    console.log('waiting for server to be up');

    tryToConnect(done);
  });

  it('mpsserver is accessible', function(done) {
    this.timeout(120000);
    void (async () => {
      const browser : Browser = await puppeteer.launch();
      try {
        const page : Page = await browser.newPage();
        page.on('response', (response) => {
          if (response.status() !== 200) {
            throw new Error('Not 200');
          }
        });
        page.on('console', (message) =>
          console.log(`  (browser) ${message.type().substr(0, 3).toUpperCase()} ${message.text()}`),
        );
        await page.goto(`http://localhost:${MPSSERVER_PORT}/`);
        await page.screenshot({ path: `screenshots/s1.png` });
        const bodyHTML = await page.evaluate(() => {
          return document.body.innerHTML
        });
        expect(bodyHTML).to.equal('MPS Server up and running.');
      } catch (e) {
        console.log('exception captured', e);
        process.exit(1);
      } finally {
        console.log('[Closing browser]');
        await browser.close();
        done();
      }
    })();
  });
  it('modules are listed', function(done) {
    this.timeout(120000);
    void (async () => {
      const browser = await puppeteer.launch();
      try {
        const page = await browser.newPage();
        page.on('response', (response) => {
          if (response.status() !== 200) {
            throw new Error('Not 200');
          }
        });
        page.on('console', (message) =>
          console.log(`  (browser) ${message.type().substr(0, 3).toUpperCase()} ${message.text()}`),
        );
        await page.goto(`http://localhost:${MPSSERVER_PORT}/modules?includeReadOnly=true&includePackaged=true`);
        await page.screenshot({ path: `screenshots/s2.png` });
        const bodyHTML = await page.evaluate(() => document.body.innerHTML);
        const modules = JSON.parse(bodyHTML).value as ModuleInfo[];
        let found = false;
        for (const m of modules) {
          if (m.name === 'com.strumenta.mpsserver.server') {
            expect(m.uuid).to.equal('bf983e15-b4da-4ef2-8e0a-5041eab7ff32');
            found = true;
          }
        }
        expect(found).to.equal(true);
      } catch (e) {
        console.log('exception captured', e);
        process.exit(1);
      } finally {
        console.log('[Closing browser]');
        await browser.close();
        done();
      }
    })();
  });
});
