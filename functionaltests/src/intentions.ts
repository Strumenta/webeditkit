import { expect } from 'chai';
import 'mocha';
import { MPSSERVER_PORT, reloadAll, tryToConnect } from './utils';
import { createInstance, getWsCommunication } from '../../src/communication';
import { w3cwebsocket } from 'websocket';

describe('Intentions API', () => {
  before(function (done) {
    this.timeout(500000);
    console.log('waiting for server to be up');

    tryToConnect(done);
  });

  beforeEach(function () {
    this.timeout(120000);
    // @ts-ignore
    global.WebSocket = w3cwebsocket;
    reloadAll();
  });

  afterEach(() => {
    // @ts-ignore
    delete global.WebSocket;
    reloadAll();
  });

  it('get intentions', (done) => {
    const ws = new w3cwebsocket(`ws://localhost:${MPSSERVER_PORT}/socket`);
    ws.onopen = () => {
      const wsc = createInstance(`ws://localhost:${MPSSERVER_PORT}/socket`, 'ExampleLanguage.sandbox', 'foo', ws as unknown as WebSocket);
      const intentions = wsc.getIntentions({
        model: 'ExampleLanguage.sandbox',
        id: {
          regularId: '7467535778008416706',
        },
      });
      void intentions.then((value) => {
        try {
          expect(value.length).to.eql(1);
          expect(value[0].index).to.eql(0);
          expect(value[0].description).to.eql('Assign Standard ID to All Projects');
          done();
        } catch (e) {
          done(e);
        }
      });
    };
  });

  it('execute intention from node', (done) => {

    // 1) Check initial name of project
    // 2) Call intention
    // 3) Verify final name of project

    const ws  = new w3cwebsocket(`ws://localhost:${MPSSERVER_PORT}/socket`);
    const nodeIdForProject1 = {
      model: 'ExampleLanguage.sandbox',
      id: {
        regularId: '7467535778008417157'
      }
    };
    const nodeIdForClient = {
      model: 'ExampleLanguage.sandbox',
      id: {
        regularId: '7467535778008416706'
      }
    };
    // tslint:disable-next-line:only-arrow-functions
    ws.onopen = async function() {
      const wsc = createInstance(`ws://localhost:${MPSSERVER_PORT}/socket`, 'ExampleLanguage.sandbox', 'foo',
        ws as unknown as WebSocket);
      const nodeData1 = await wsc.getNodeData(nodeIdForProject1);
      expect(nodeData1.properties.id).eql('ACME-1');
      const intentions = await wsc.getIntentions(nodeIdForProject1);
      expect(intentions.length).to.eql(2);
      expect(intentions[1].index).to.eql(1);
      expect(intentions[1].description).to.eql('Assign Standard ID to All Projects');
      intentions[1].execute();
      setTimeout(()=>{
        void wsc.getNodeData(nodeIdForProject1).then((nodeData2)=>{
          expect(nodeData2.properties.id).eql('ACBU');
          done();
        });
      }, 400);
    }
  });

  it('execute intention from parent', (done) => {

      // 1) Check initial name of project
      // 2) Call intention
      // 3) Verify final name of project

      const ws  = new w3cwebsocket(`ws://localhost:${MPSSERVER_PORT}/socket`);
      const nodeIdForProject1 = {
          model: 'ExampleLanguage.sandbox',
          id: {
              regularId: '7467535778008417157'
          }
      };
      const nodeIdForClient = {
          model: 'ExampleLanguage.sandbox',
          id: {
              regularId: '7467535778008416706'
          }
      };
      ws.onopen = async () => {
          const wsc = createInstance(`ws://localhost:${MPSSERVER_PORT}/socket`, 'ExampleLanguage.sandbox', 'foo',
            ws as unknown as WebSocket);
          const nodeData1 = await wsc.getNodeData(nodeIdForProject1);
          expect(nodeData1.properties.id).eql('ACME-1');
          const intentions = await wsc.getIntentions(nodeIdForClient);
          expect(intentions.length).to.eql(1);
          expect(intentions[0].index).to.eql(0);
          expect(intentions[0].description).to.eql('Assign Standard ID to All Projects');
          intentions[0].execute();
          setTimeout(()=>{
            void wsc.getNodeData(nodeIdForProject1).then((nodeData2)=>{
              expect(nodeData2.properties.id).eql('ACBU');
              done();
            });
          }, 400);
      }
  });
});
