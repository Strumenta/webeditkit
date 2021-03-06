import { expect } from 'chai';
import 'mocha';
import { addClass, fixedCell, map } from '../src/internal';
import { addInsertHook, focusOnNode, handleSelfDeletion, separate, setDataset } from '../src/internal';

import { Server, WebSocket } from 'mock-socket';
import { VNode, patch, toVNode, h } from '../src/internal';

import { createInstance } from '../src/internal';
import { assertTheseMessagesAreReceived, compareVNodes, prepareFakeDom, pressChar } from './testutils';
import { dataToNode } from '../src/internal';
import { NodeData } from '../src/internal';
import { nodeReference } from '../src/internal';

import { JSDOM } from 'jsdom';

const init2html = require('snabbdom-to-html/init');
const modules = require('snabbdom-to-html/modules/index');
const toHTML = init2html([modules.class, modules.props, modules.attributes, modules.style, modules.dataset]);

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
  name: 'My calculations',
  children: [
    {
      name: 'a',
      containingLink: 'inputs',
      children: [
        {
          name: '-',
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
      name: 'b',
      containingLink: 'inputs',
      children: [
        {
          name: '-',
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

describe('Presentation.Cells.Support', () => {
  describe('should support map', () => {
    it('it should be rendered in a certain way', () => {
      const aNode = dataToNode(rootData1);
      const res = map(['a', 'b', 'c'], (el) => {
        return fixedCell(aNode, el);
      });
      expect(res.length).to.eql(3);
      compareVNodes(res[0] as VNode, fixedCell(aNode, 'a'));
      compareVNodes(res[1] as VNode, fixedCell(aNode, 'b'));
      compareVNodes(res[2] as VNode, fixedCell(aNode, 'c'));
    });
  });

  describe('should support separate', () => {
    it('it should be rendered in a certain way an empty list with no separator', () => {
      const aNode = dataToNode(rootData1);
      const res = separate([]);
      expect(res.length).to.eql(0);
    });
    it('it should be rendered in a certain way an empty list with separator', () => {
      const aNode = dataToNode(rootData1);
      const res = separate([], () => {
        return fixedCell(aNode, ',');
      });
      expect(res.length).to.eql(0);
    });
    it('it should be rendered in a certain way a non empty list with no separator', () => {
      const aNode = dataToNode(rootData1);
      const res = separate([fixedCell(aNode, 'a'), fixedCell(aNode, 'b')]);
      expect(res.length).to.eql(2);
      compareVNodes(res[0] as VNode, fixedCell(aNode, 'a'));
      compareVNodes(res[1] as VNode, fixedCell(aNode, 'b'));
    });
    it('it should be rendered in a certain way a non empty list with separator', () => {
      const aNode = dataToNode(rootData1);
      const res = separate([fixedCell(aNode, 'a'), fixedCell(aNode, 'b')], () => {
        return fixedCell(aNode, ',');
      });
      expect(res.length).to.eql(3);
      compareVNodes(res[0] as VNode, fixedCell(aNode, 'a'));
      compareVNodes(res[1] as VNode, fixedCell(aNode, ','));
      compareVNodes(res[2] as VNode, fixedCell(aNode, 'b'));
    });
  });

  describe('should support addInsertHook', () => {
    it('it should be triggered on insert', (done) => {
      const dom = new JSDOM(html1);
      const doc = dom.window.document;
      // @ts-ignore
      global.document = doc;

      const aNode = dataToNode(rootData1);
      const cell = fixedCell(aNode, 'My fixed test');
      const cellWithHook = addInsertHook(cell, (myNode) => {
        compareVNodes(myNode, cellWithHook);
        done();
      });
      patch(toVNode(document.querySelector('#calc')!), cellWithHook);
    });
  });

  describe('should support focusOnNode', () => {
    it('it should be triggered', (done) => {
      const doc = prepareFakeDom(html1);

      const aNode = dataToNode(rootData1);
      const cell = fixedCell(aNode, 'My fixed test');
      const cellWithHook = addClass(
        setDataset(
          addInsertHook(cell, (myNode) => {
            focusOnNode('my-node-id', 'calc');
            // We need to check who has the focus
            expect(doc.activeElement!.tagName).to.equals('INPUT');
            expect(doc.activeElement!.className).to.equals('fixed represent-node');
            expect((doc.activeElement as any).dataset.node_represented).to.eql('my-node-id');
            done();
          }),
          { node_represented: 'my-node-id' },
        ),
        'represent-node',
      );
      const container = h('div#calc', {}, [cellWithHook]);
      patch(toVNode(document.querySelector('#calc')!), container);
    });
  });

  describe('should support handleSelfDeletion', () => {
    it('it should handle marking with deleting class', (done) => {
      const doc = prepareFakeDom(html1);

      const aNode = dataToNode(rootData1);
      const cell = fixedCell(aNode, 'myFixedCell');
      const cellWithHook = addClass(
        addInsertHook(cell, (myNode: VNode) => {
          // @ts-ignore
          expect(myNode.elm.className).to.eql('fixed represent-node');
          handleSelfDeletion(myNode.elm as HTMLElement, aNode);
          // @ts-ignore
          expect(myNode.elm.className).to.eql('fixed represent-node deleting');
          done();
        }),
        'represent-node',
      );

      const container = h('div#calc', {}, [cellWithHook]);
      patch(toVNode(document.querySelector('#calc')!), container);
    });
  });

  describe('should support handleSelfDeletion', () => {
    it('it should handle triggering deleteMe', (done) => {
      let received = 0;
      const fakeURL = 'ws://localhost:8080';
      const mockServer = new Server(fakeURL);
      const receivedArray = [false, false];
      mockServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          if (received <= 1) {
            assertTheseMessagesAreReceived(receivedArray, received, data as string, [
              {
                type: 'deleteNode',
                check: (msg) => {
                  expect(msg).to.eql({
                    type: 'deleteNode',
                    node: nodeReference('my.qualified.model', '324292001770075100'),
                  });
                  mockServer.close();
                  done();
                },
              },
              {
                type: 'registerForChanges',
                check: (msg) => {
                  expect(JSON.parse(data as string)).to.eql({
                    type: 'registerForChanges',
                    modelName: 'my.qualified.model',
                  });
                },
              },
            ]);
          } else {
            throw new Error('Too many messages');
          }
          received += 1;
        });
      });
      // @ts-ignore
      global.WebSocket = WebSocket;
      createInstance(fakeURL, 'my.qualified.model', 'calc');

      const doc = prepareFakeDom(html1);

      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');
      const cell = fixedCell(aNode, 'myFixedCell');
      const cellWithHook = addClass(
        addInsertHook(cell, (myNode: VNode) => {
          // @ts-ignore
          expect(myNode.elm.className).to.eql('fixed represent-node');
          handleSelfDeletion(myNode.elm as HTMLElement, aNode);
          handleSelfDeletion(myNode.elm as HTMLElement, aNode);
          // @ts-ignore
          expect(myNode.elm.className).to.eql('fixed represent-node deleting');
        }),
        'represent-node',
      );

      const container = h('div#calc', {}, [cellWithHook]);
      patch(toVNode(document.querySelector('#calc')!), container);
    });
  });
});
