import { expect } from 'chai';
import 'mocha';
import { VNode } from 'snabbdom/vnode';
import { addClass, alternativesProviderForAbstractConcept, fixedCell, map } from '../src/presentation/cells';
import {
  addId,
  addInsertHook,
  alternativesProviderForAddingChild,
  AutocompleteAlternative,
  focusOnNode,
  handleSelfDeletion,
  installAutocomplete,
  separate,
  setDataset,
  SuggestionsReceiver,
} from '../src/presentation/cells';

import { Server, WebSocket } from 'mock-socket';
import { init } from 'snabbdom/snabbdom';

import h from 'snabbdom/h'; // helper function for creating vnodes
import toVNode from 'snabbdom/tovnode';

import * as sclass from 'snabbdom/modules/class';
import * as sprops from 'snabbdom/modules/props';
import * as sstyle from 'snabbdom/modules/style';
import * as seventlisteners from 'snabbdom/modules/eventlisteners';
import * as sdataset from 'snabbdom/modules/dataset';
import { createInstance } from '../src/communication/wscommunication';
import { compareVNodes, prepareFakeDom, pressChar } from './testutils';
import { clearDatamodelRoots, dataToNode } from '../src/datamodel/registry';
import { clearRendererRegistry } from '../src/presentation/renderer';
import { AskAlternatives, Message, nodeIDInModel } from '../src/communication/messages';
import { NodeData } from '../src/datamodel/misc';

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const init2html = require('snabbdom-to-html/init');
const modules = require('snabbdom-to-html/modules/index');
const toHTML = init2html([modules.class, modules.props, modules.attributes, modules.style, modules.dataset]);

const patch = init([
  // Init patch function with chosen modules
  sclass.default, // makes it easy to toggle classes
  sprops.default, // for setting properties on DOM elements
  sstyle.default, // handles styling on elements with support for animations
  seventlisteners.default, // attaches event listeners
  sdataset.default,
]);

const html1 = `<html>
\t<body data-gr-c-s-loaded="true">
\t\t<div id="calc" class="editor">
\t\t\t<div class="vertical-group represent-node" data-node_represented="324292001770075100">
\t\t\t\t<div class="row">
\t\t\t\t\t<input class="fixed title" style="width: 120.875px;">
\t\t\t\t\t<input class="editable title" placeholder="<no name>" required="" style="width: 151.688px;">
\t\t\t\t</div>
\t\t\t\t<div class="row"></div>
\t\t\t\t<div class="row">
\t\t\t\t\t<input class="fixed strong" style="width: 39.8375px;">
\t\t\t\t</div>
\t\t\t\t<div class="row">
\t\t\t\t\t<div class="tab"></div>
\t\t\t\t\t<div class="vertical-collection represent-collection" data-relation_represented="inputs">
\t\t\t\t\t\t<div class="row">
\t\t\t\t\t\t\t<div class="horizontal-group represent-node" data-node_represented="1848360241685547698">
\t\t\t\t\t\t\t\t<input class="editable" placeholder="<no name>" required="" style="width: 10px;">
\t\t\t\t\t\t\t\t<input class="fixed keyword" style="width: 40.225px;">
\t\t\t\t\t\t\t\t<input class="fixed type represent-node" data-node_represented="1848360241685547702" style="width: 45.2875px;">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div class="row">
\t\t\t\t\t\t\t<div class="horizontal-group represent-node" data-node_represented="1848360241685575196">
\t\t\t\t\t\t\t\t<input class="editable" placeholder="<no name>" required="" style="width: 26.6px;" value="sdsd">
\t\t\t\t\t\t\t\t<input class="fixed keyword" style="width: 40.225px;">
\t\t\t\t\t\t\t\t<input class="fixed type represent-node" data-node_represented="1848360241685575206" style="width: 45.2875px;">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div class="row">
\t\t\t\t\t\t\t<div class="horizontal-group represent-node" data-node_represented="1848360241685547705">
\t\t\t\t\t\t\t\t<input class="editable" placeholder="<no name>" required="" style="width: 10px;">
\t\t\t\t\t\t\t\t<input class="fixed keyword" style="width: 40.225px;">
\t\t\t\t\t\t\t\t<input class="fixed type represent-node" data-node_represented="1848360241685547711" style="width: 34.0125px;">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</body>
</html>`;

const rootData1: NodeData = {
  children: [
    {
      containingLink: 'inputs',
      children: [
        {
          containingLink: 'type',
          children: [],
          properties: {},
          refs: {},
          id: {
            regularId: '1848360241685547702',
          },
          concept: 'com.strumenta.financialcalc.BooleanType',
          abstractConcept: false,
          modelName: '',
        },
      ],
      properties: {
        name: 'a',
      },
      refs: {},
      id: {
        regularId: '1848360241685547698',
      },
      concept: 'com.strumenta.financialcalc.Input',
      abstractConcept: false,
      modelName: '',
    },
    {
      containingLink: 'inputs',
      children: [
        {
          containingLink: 'type',
          children: [],
          properties: {},
          refs: {},
          id: {
            regularId: '1848360241685547711',
          },
          concept: 'com.strumenta.financialcalc.StringType',
          abstractConcept: false,
          modelName: '',
        },
      ],
      properties: {
        name: 'b',
      },
      refs: {},
      id: {
        regularId: '1848360241685547705',
      },
      concept: 'com.strumenta.financialcalc.Input',
      abstractConcept: false,
      modelName: '',
    },
  ],
  properties: {
    name: 'My calculations',
  },
  refs: {},
  id: {
    regularId: '324292001770075100',
  },
  concept: 'com.strumenta.financialcalc.FinancialCalcSheet',
  abstractConcept: false,
  modelName: '',
};

describe('Presentation.Cells.Autocompletion', () => {
  let doc: Document | undefined;

  beforeEach(function () {
    doc = prepareFakeDom(html1);

    clearDatamodelRoots();
    clearRendererRegistry();
  });

  let mockServer: Server | undefined;

  afterEach(function () {
    if (mockServer != null) {
      mockServer.close();
      mockServer = undefined;
    }

    clearDatamodelRoots();
    clearRendererRegistry();

    // @ts-ignore
    delete global.$;
    // @ts-ignore
    delete global.jQuery;
    // @ts-ignore
    delete global.window;
    // @ts-ignore
    delete global.document;
  });

  describe('should support alternativesProviderForAddingChild', () => {
    it('it should handle positive case', (done) => {
      let received = 0;
      const fakeURL = 'ws://localhost:8080';
      let askAlternativesReceived = false;
      let registerForChangesReceived = false;
      mockServer = new Server(fakeURL);
      mockServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          if (received <= 1) {
            const dataj: Message = JSON.parse(data as string) as Message;
            if (dataj.type === 'askAlternatives') {
              const msg = dataj as AskAlternatives;
              expect(msg.type).to.eql('askAlternatives');
              expect(msg.containmentName).to.eql('foo');
              expect(msg.nodeId).to.eql('324292001770075100');
              expect(msg.modelName).to.eql('my.qualified.model');
              const requestId = msg.requestId;
              askAlternativesReceived = true;

              socket.send(
                JSON.stringify({
                  type: 'AnswerAlternatives',
                  requestId,
                  items: [
                    { alias: 'alias1', conceptName: 'foo.bar.concept1' },
                    { alias: 'alias2', conceptName: 'foo.bar.concept2' },
                  ],
                }),
              );
            } else if (dataj.type === 'registerForChanges') {
              expect(JSON.parse(data as string)).to.eql({
                type: 'registerForChanges',
                modelName: 'my.qualified.model',
              });
              registerForChangesReceived = true;
            }
            if (received === 1) {
              expect(registerForChangesReceived).to.eql(true);
              expect(askAlternativesReceived).to.eql(true);
            }
          } else if (received == 2) {
            const obj = JSON.parse(data as string);
            delete obj.requestId;
            expect(obj).to.eql({
              type: 'addChild',
              index: -1,
              container: nodeIDInModel('my.qualified.model', '324292001770075100'),
              containmentName: 'foo',
              conceptToInstantiate: 'foo.bar.concept1',
            });
            mockServer?.close();
            done();
          } else {
            throw new Error('Too many messages');
          }
          received += 1;
        });
      });
      // @ts-ignore
      global.WebSocket = WebSocket;
      createInstance(fakeURL, 'my.qualified.model', 'calc');
      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');
      const suggestionsReceiverFactory = alternativesProviderForAddingChild(aNode, 'foo');
      suggestionsReceiverFactory((suggestions: AutocompleteAlternative[]): void => {
        expect(suggestions.length).to.equals(2);
        expect(suggestions[0].label).to.eql('alias1');
        expect(suggestions[1].label).to.eql('alias2');
        suggestions[0].execute();
      });
    });
  });

  describe('should support alternativesProviderForAbstractConcept', () => {
    it('it should handle positive case', (done) => {
      let received = 0;
      const fakeURL = 'ws://localhost:8080';

      let askAlternativesReceived = false;
      let registerForChangesReceived = false;

      mockServer = new Server(fakeURL);
      mockServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          if (received <= 1) {
            const dataj = JSON.parse(data as string) as Message;
            if (dataj.type === 'askAlternatives') {
              const msg = dataj as AskAlternatives;
              expect(msg.type).to.eql('askAlternatives');
              expect(msg.containmentName).to.eql('type');
              expect(msg.nodeId).to.eql('1848360241685547698');
              expect(msg.modelName).to.eql('my.qualified.model');
              const requestId = msg.requestId;

              socket.send(
                JSON.stringify({
                  type: 'AnswerAlternatives',
                  requestId,
                  items: [
                    { alias: 'alias1', conceptName: 'foo.bar.concept1' },
                    { alias: 'alias2', conceptName: 'foo.bar.concept2' },
                  ],
                }),
              );
              askAlternativesReceived = true;
            } else if (dataj.type === 'registerForChanges') {
              expect(JSON.parse(data as string)).to.eql({
                type: 'registerForChanges',
                modelName: 'my.qualified.model',
              });
              registerForChangesReceived = true;
            }
            if (received === 1) {
              expect(registerForChangesReceived).to.eql(true);
              expect(askAlternativesReceived).to.eql(true);
            }
          } else if (received == 2) {
            const obj = JSON.parse(data as string);
            delete obj['requestId'];
            expect(obj).to.eql({
              type: 'setChild',
              container: nodeIDInModel('my.qualified.model', '1848360241685547698'),
              containmentName: 'type',
              conceptToInstantiate: 'foo.bar.concept1',
            });
            mockServer?.close();
            done();
          } else {
            throw new Error('Too many messages');
          }
          received += 1;
        });
      });
      // @ts-ignore
      global.WebSocket = WebSocket;
      createInstance(fakeURL, 'my.qualified.model', 'calc');
      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');

      const inputsType = aNode.childrenByLinkName('inputs')[0].childByLinkName('type');
      expect(inputsType).to.be.not.null;

      const suggestionsReceiverFactory = alternativesProviderForAbstractConcept(inputsType!);

      suggestionsReceiverFactory((suggestions: AutocompleteAlternative[]): void => {
        expect(suggestions.length).to.equals(2);
        expect(suggestions[0].label).to.eql('alias1');
        expect(suggestions[1].label).to.eql('alias2');
        suggestions[0].execute();
      });
    });
    it('it should handle case with parent not set', (done) => {
      let received = 0;
      const fakeURL = 'ws://localhost:8080';
      mockServer = new Server(fakeURL);
      mockServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          if (received == 0) {
            expect(JSON.parse(data as string)).to.eql({ type: 'registerForChanges', modelName: 'my.qualified.model' });
          } else {
            throw new Error('Too many messages');
          }
          received += 1;
        });
      });
      // @ts-ignore
      global.WebSocket = WebSocket;
      createInstance(fakeURL, 'my.qualified.model', 'calc');
      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');
      expect(() => {
        alternativesProviderForAbstractConcept(aNode);
      }).to.throw('The given node has no parent');
      mockServer.close();
      done();
    });
  });

  describe('should support installAutocomplete', () => {
    it('it should handle positive case', (done) => {
      //const doc = prepareFakeDom(html1);

      const aNode = dataToNode(rootData1);
      let cell = h('input', {}, []);
      let cellWithHook = addInsertHook(cell, (myNode: VNode) => {
        installAutocomplete(
          myNode,
          (suggestionsReceiver: SuggestionsReceiver) => {
            suggestionsReceiver([
              {
                label: 'xyz',
                execute: () => {
                  console.log('executing');
                },
              },
            ]);
            done();
          },
          true,
        );
        // @ts-ignore
        myNode.elm.focus();

        pressChar(doc!.activeElement!, 'x', 88);
      });

      const container = h('div#calc', {}, [cellWithHook]);
      patch(toVNode(document.querySelector('#calc')!), container);
    });
  });
});
