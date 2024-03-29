import { NodeData } from '../src/internal';
import { expect } from 'chai';
import 'mocha';
import {
  childCell,
  Data,
  editableCell,
  emptyRow,
  fixedCell,
  horizontalCollectionCell,
  horizontalGroupCell,
  referenceCell,
  row,
  tabCell,
  verticalCollectionCell,
  verticalGroupCell,
} from '../src/internal';
import { flattenArray } from '../src/internal';
import { addInsertHook } from '../src/internal';

import { DefaultInsertion, PropertyChange } from '../src/internal';

import { JSDOM } from 'jsdom';

const toHtmlInit = require('snabbdom-to-html/init');
const modules = require('snabbdom-to-html/modules/index');
const toHTML = toHtmlInit([modules.class, modules.props, modules.attributes, modules.style]);
(global as any).fetch = require('node-fetch');
const fetchMock = require('fetch-mock');

import { h, toVNode, patch } from '../src/internal';

import { createInstance } from '../src/communication/wscommunication';
import { Server, WebSocket } from 'mock-socket';
import {
  assertTheseMessagesAreReceived,
  focusedElement,
  prepareFakeDom,
  pressArrowLeft,
  pressArrowRight,
  pressBackspace,
  pressEnter,
  triggerInputEvent,
} from './testutils';
import { clearRendererRegistry } from '../src/presentation/renderer';
import { clearDatamodelRoots, dataToNode, setDefaultBaseUrl } from '../src/datamodel/registry';
import { SinonFakeTimers } from 'sinon';

const sinon = require('sinon');

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
\t\t\t\t\t<div class="vertical-collection represent-collection"data-relation_represented="inputs">
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
          name: 'some name',
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
          name: 'some name',
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

const rootData2: NodeData = {
  name: 'My calculations',
  children: [
    {
      name: 'a',
      containingLink: 'inputs',
      children: [],
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
          name: 'some name',
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

const rootData3: NodeData = {
  name: 'My calculations',
  children: [
    {
      name: 'a',
      containingLink: 'inputs',
      children: [],
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
          name: 'some name',
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
      refs: {
        myref: {
          model: {
            qualifiedName: 'my.referred.model',
          },
          id: {
            regularId: '123-foo',
          },
        },
      },
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

let data: Data;

describe('Cells.Types', () => {
  beforeEach(() => {
    data = new Data();
  });

  afterEach(() => {
    sinon.restore();

    clearDatamodelRoots();
    clearRendererRegistry();

    // @ts-ignore
    delete global.window;
    // @ts-ignore
    delete global.document;
  });

  describe('should support fixed cell', () => {
    it('it should be rendered in a certain way', () => {
      const aNode = dataToNode(rootData1);
      const cell = fixedCell(aNode, 'My fixed test');
      expect(toHTML(cell)).to.eql('<input class="fixed" value="My fixed test">');
    });
    it('it should handle left arrow', (done) => {
      const doc = prepareFakeDom(html1);

      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');

      const cell = fixedCell(aNode, 'My fixed cell');
      const cellWithHook = addInsertHook(cell, (vnode) => {
        const myInput = vnode.elm as HTMLInputElement;
        expect(myInput.tagName).to.eql('INPUT');
        myInput.selectionStart = 1;
        myInput.selectionEnd = 1;
        myInput.focus();
        expect(doc.activeElement!.outerHTML).to.eql('<input class="fixed">');
        pressArrowLeft(myInput);
        expect(doc.activeElement!.outerHTML).to.eql('<input class="bef">');
        done();
      });

      const container = h('div#calc.editor', {}, [h('input.bef', {}, []), cellWithHook, h('input.aft', {}, [])]);
      patch(toVNode(document.querySelector('#calc')!), container);
    });
    it('it should handle right arrow', (done) => {
      const doc = prepareFakeDom(html1);

      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');

      const cell = fixedCell(aNode, 'My fixed cell');
      const cellWithHook = addInsertHook(cell, (vnode) => {
        const myInput = vnode.elm as HTMLInputElement;
        expect(myInput.tagName).to.eql('INPUT');
        myInput.selectionStart = 1;
        myInput.selectionEnd = 1;
        myInput.focus();
        expect(doc.activeElement!.outerHTML).to.eql('<input class="fixed">');
        pressArrowRight(myInput);
        expect(doc.activeElement!.outerHTML).to.eql('<input class="aft">');
        done();
      });

      const container = h('div#calc.editor', {}, [h('input.bef', {}, []), cellWithHook, h('input.aft', {}, [])]);
      patch(toVNode(document.querySelector('#calc')!), container);
    });
  });

  describe('should support reference cell', () => {
    it('it should be rendered in a certain way when null', () => {
      const rootNode = dataToNode(rootData1);
      const inputNode = rootNode.childrenByLinkName('inputs')[0];
      const cell = referenceCell(inputNode, 'type');
      expect(toHTML(cell)).to.equal('<input class="fixed empty-reference" value="&lt;no type&gt;">');
    });
    it('it should not use extra classes when null', () => {
      const rootNode = dataToNode(rootData1);
      const inputNode = rootNode.childrenByLinkName('inputs')[0];
      const cell = referenceCell(inputNode, 'type', {extraClasses:['foo', 'bar']});
      expect(toHTML(cell)).to.equal('<input class="fixed empty-reference" value="&lt;no type&gt;">');
    });
    it('it should handle left arrow', (done) => {
      const doc = prepareFakeDom(html1);

      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');

      const inputNode = aNode.childrenByLinkName('inputs')[0];
      const cell = referenceCell(inputNode, 'type');

      const cellWithHook = addInsertHook(cell, (vnode) => {
        const myInput = vnode.elm as HTMLInputElement;
        expect(myInput.tagName).to.eql('INPUT');
        myInput.selectionStart = 1;
        myInput.selectionEnd = 1;
        myInput.focus();
        expect(doc.activeElement!.outerHTML).to.equal(
          '<input class="fixed empty-reference" data-node_represented="1848360241685547698" data-reference_represented="type">',
        );
        pressArrowLeft(myInput);
        expect(doc.activeElement!.outerHTML).to.eql('<input class="bef">');
        done();
      });

      const container = h('div#calc.editor', {}, [h('input.bef', {}, []), cellWithHook, h('input.aft', {}, [])]);
      patch(toVNode(document.querySelector('#calc')!), container);
    });
    it('it should handle right arrow', (done) => {
      const doc = prepareFakeDom(html1);

      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');

      const inputNode = aNode.childrenByLinkName('inputs')[0];
      const cell = referenceCell(inputNode, 'type');

      const cellWithHook = addInsertHook(cell, (vnode) => {
        const myInput = vnode.elm as HTMLInputElement;
        expect(myInput.tagName).to.eql('INPUT');
        myInput.selectionStart = 1;
        myInput.selectionEnd = 1;
        myInput.focus();
        expect(doc.activeElement!.outerHTML).to.eql(
          '<input class="fixed empty-reference" data-node_represented="1848360241685547698" data-reference_represented="type">',
        );
        pressArrowRight(myInput);
        expect(doc.activeElement!.outerHTML).to.eql('<input class="aft">');
        done();
      });

      const container = h('div#calc.editor', {}, [h('input.bef', {}, []), cellWithHook, h('input.aft', {}, [])]);
      patch(toVNode(document.querySelector('#calc')!), container);
    });
    it('it should load value', (done) => {
      const doc = prepareFakeDom(html1);

      const aNode = dataToNode(rootData3);
      aNode.injectModelName('my.qualified.model', 'calc');

      const inputNode = aNode.childrenByLinkName('inputs')[1];
      const cell = referenceCell(inputNode, 'myref');
      expect(toHTML(cell)).to.equal('<input class="reference" value="Loading...">');
      const container = h('div#calc.editor', {}, [cell]);

      let received = 0;
      const fakeURL = 'ws://localhost:8080';
      const mockServer = new Server(fakeURL);
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

      // we need to emulate also http

      // @ts-ignore
      fetchMock.getOnce('http://localhost:8080/models/my.referred.model/123-foo', () => {
        mockServer.close();
        done();
        return {
          concept: 'my.referred.Concept',
          containingLink: '',
          id: {
            regularId: '123-foo',
          },
          modelName: 'my.referred.model',
          parent: undefined,
          rootName: 'myOtherModel',
          abstractConcept: false,
          properties: { name: 'My referred node' },
          children: [],
          refs: {},
        };
      });

      setDefaultBaseUrl('localhost:8080');

      patch(toVNode(document.querySelector('#calc')!), container);
      expect(doc.querySelector('input')!.value).to.eql('My referred node');
    });
  });

  describe('should support row cell', () => {
    it('it should be rendered in a certain way', () => {
      const aNode = dataToNode(rootData1);
      const cell = row(fixedCell(aNode, 'a'), fixedCell(aNode, 'b'));
      expect(toHTML(cell)).to.eql(
        '<div class="row"><input class="fixed" value="a"><input class="fixed" value="b"></div>',
      );
    });
  });

  describe('should support flattenArray', () => {
    it('for empty values', () => {
      expect(flattenArray([])).to.eql([]);
    });
    it('for simple values', () => {
      expect(flattenArray([1, 2, 3])).to.eql([1, 2, 3]);
    });
    it('for complex values', () => {
      expect(flattenArray([1, 2, [3, [4, 5], 6], 7])).to.eql([1, 2, 3, 4, 5, 6, 7]);
    });
  });

  describe('should support childCell', () => {
    it('it should be rendered in a certain way (child present)', () => {
      const aNode = dataToNode(rootData1);
      const cell = childCell(aNode.childrenByLinkName('inputs')[0], 'type');
      expect(toHTML(cell)).to.eql(
        '<input class="fixed default-cell-concrete represent-node" value="[default BooleanType]">',
      );
    });
    it('it should be rendered in a certain way (child not present)', () => {
      const aNode = dataToNode(rootData2);
      const cell = childCell(aNode.childrenByLinkName('inputs')[0], 'type');
      expect(toHTML(cell)).to.eql('<input class="fixed missing-element" value="&lt;no type&gt;">');
    });
  });

  describe('should support verticalCollectionCell', () => {
    it('it should be rendered in a certain way for not empty children wrapping in rows', () => {
      const aNode = dataToNode(rootData1);
      const cell = verticalCollectionCell(aNode, 'inputs');
      expect(toHTML(cell)).to.eql(
        '<div class="vertical-collection represent-collection"><div class="row"><input class="fixed default-cell-concrete represent-node" value="[default Input]"></div><div class="row"><input class="fixed default-cell-concrete represent-node" value="[default Input]"></div></div>',
      );
    });
    it('it should be rendered in a certain way for not empty children not wrapping in rows', () => {
      const aNode = dataToNode(rootData1);
      const cell = verticalCollectionCell(aNode, 'inputs', {wrapInRows:false});
      expect(toHTML(cell)).to.eql(
        '<div class="vertical-collection represent-collection"><input class="fixed default-cell-concrete represent-node" value="[default Input]"><input class="fixed default-cell-concrete represent-node" value="[default Input]"></div>',
      );
    });
    it('it should be rendered in a certain way for empty children', () => {
      const aNode = dataToNode(rootData1);
      const cell = verticalCollectionCell(aNode, 'unexisting');
      expect(toHTML(cell)).to.eql(
        '<div class="vertical-collection represent-collection"><input class="fixed empty-collection" value="&lt;&lt; ... &gt;&gt;"></div>',
      );
    });
    it('when empty it should react to enter in a certain way', (done) => {
      const doc = prepareFakeDom(html1);

      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');

      let received = 0;
      const fakeURL = 'ws://localhost:8080';
      const mockServer = new Server(fakeURL);
      const receivedArray = [false, false];
      mockServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          if (received <= 1) {
            assertTheseMessagesAreReceived(receivedArray, received, data as string, [
              {
                type: 'defaultInsertion',
                check: (msg: DefaultInsertion) => {
                  expect(msg.type).to.eql('defaultInsertion');
                  expect(msg.containmentName).to.eql('unexisting');
                  expect(msg.container).to.eql('324292001770075100');
                  expect(msg.modelName).to.eql('my.qualified.model');
                  console.log('focus before', focusedElement());
                  socket.send(
                    JSON.stringify({
                      type: 'AnswerDefaultInsertion',
                      requestId: msg.requestId,
                      addedNodeID: {
                        regularId: 'xxx-123',
                      },
                    }),
                  );
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
            if (received === 1) {
              mockServer.close();
              done();
            }
          } else {
            throw new Error('Too many messages');
          }
          received += 1;
        });
      });
      // @ts-ignore
      global.WebSocket = WebSocket;
      createInstance(fakeURL, 'my.qualified.model', 'calc');

      const cell = verticalCollectionCell(aNode, 'unexisting');
      const cellWithHook = addInsertHook(cell, (vnode) => {
        const myInput = vnode.elm!.firstChild as HTMLInputElement;
        expect(myInput.tagName).to.eql('INPUT');
        pressEnter(myInput);
      });

      const addedNode = h('input.represent-node', { dataset: { node_represented: 'xxx-123' } }, ['My added node']);
      const container = h('div#calc', {}, [cellWithHook, addedNode]);
      patch(toVNode(document.querySelector('#calc')!), container);
    });
  });

  describe('should support horizontalCollectionCell', () => {
    it('it should be rendered in a certain way for not empty children', () => {
      const aNode = dataToNode(rootData1);
      const cell = horizontalCollectionCell(aNode, 'inputs');
      expect(toHTML(cell)).to.eql(
        '<div class="horizontal-collection"><input class="fixed default-cell-concrete represent-node" value="[default Input]"><input class="fixed default-cell-concrete represent-node" value="[default Input]"></div>',
      );
    });
    it('it should be rendered in a certain way for empty children', () => {
      const aNode = dataToNode(rootData1);
      const cell = horizontalCollectionCell(aNode, 'unexisting');
      expect(toHTML(cell)).to.eql(
        '<div class="horizontal-collection"><input class="fixed empty-collection" value="&lt;&lt; ... &gt;&gt;"></div>',
      );
    });
  });

  describe('should support horizontalGroupCell', () => {
    it('it should be rendered in a certain way (empty)', () => {
      const cell = horizontalGroupCell();
      expect(toHTML(cell)).to.eql('<div class="horizontal-group"></div>');
    });
    it('it should be rendered in a certain way (not empty)', () => {
      const cell = horizontalGroupCell(h('span', {}, ['a']), h('span', {}, ['b']));
      expect(toHTML(cell)).to.eql('<div class="horizontal-group"><span>a</span><span>b</span></div>');
    });
  });

  describe('should support verticalGroupCell', () => {
    it('it should be rendered in a certain way (empty)', () => {
      const cell = verticalGroupCell();
      expect(toHTML(cell)).to.eql('<div class="vertical-group"></div>');
    });
    it('it should be rendered in a certain way (not empty)', () => {
      const cell = verticalGroupCell(h('span', {}, ['a']), h('span', {}, ['b']));
      expect(toHTML(cell)).to.eql('<div class="vertical-group"><span>a</span><span>b</span></div>');
    });
  });

  describe('should support emptyRow', () => {
    it('it should be rendered in a certain way', () => {
      const cell = emptyRow();
      expect(toHTML(cell)).to.eql('<div class="row"></div>');
    });
  });

  describe('should support tabCell', () => {
    it('it should be rendered in a certain way', () => {
      const cell = tabCell();
      expect(toHTML(cell)).to.eql('<div class="tab"></div>');
    });
  });

  describe('should support editableCell', () => {
    let clock: SinonFakeTimers;
    before(() => {
      clock = sinon.useFakeTimers();
    });
    after(() => {
      clock.restore();
    });
    const fakeURL = 'ws://localhost:8080';

    it('it should be rendered in a certain way', () => {
      const aNode = dataToNode(rootData1);
      const cell = editableCell(data, aNode, 'name');
      expect(toHTML(cell)).to.eql(
        '<input class="editable" value="My calculations" placeholder="&lt;no name&gt;" required="required">',
      );
    });
    it('it should support extra classes', () => {
      const aNode = dataToNode(rootData1);
      const cell = editableCell(data, aNode, 'name', ['a', 'b']);
      expect(toHTML(cell)).to.eql(
        '<input class="editable a b" value="My calculations" placeholder="&lt;no name&gt;" required="required">',
      );
    });
    it('it should react to ArrowRight', () => {
      const doc = prepareFakeDom(html1);

      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');

      const cell = editableCell(data, aNode, 'name');
      const cellWithHook = addInsertHook(cell, (vnode) => {
        const myInput = vnode.elm as HTMLInputElement;
        expect(myInput.tagName).to.eql('INPUT');
        myInput.focus();
        expect(doc.activeElement!.outerHTML).to.eql('<input class="editable" placeholder="<no name>" required="">');
        pressArrowRight(myInput);
        expect(doc.activeElement!.outerHTML).to.eql('<input class="aft">');
      });

      const container = h('div#calc.editor', {}, [h('input.bef', {}, []), cellWithHook, h('input.aft', {}, [])]);
      patch(toVNode(document.querySelector('#calc')!), container);
    });
    it('it should react to ArrowLeft with selection at start', () => {
      const doc = prepareFakeDom(html1);

      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');

      const cell = editableCell(data, aNode, 'name');
      const cellWithHook = addInsertHook(cell, (vnode) => {
        const myInput = vnode.elm as HTMLInputElement;
        expect(myInput.tagName).to.eql('INPUT');
        myInput.selectionStart = 0;
        myInput.selectionEnd = 0;
        myInput.focus();
        expect(doc.activeElement!.outerHTML).to.eql('<input class="editable" placeholder="<no name>" required="">');
        pressArrowLeft(myInput);
        expect(doc.activeElement!.outerHTML).to.eql('<input class="bef">');
      });

      const container = h('div#calc.editor', {}, [h('input.bef', {}, []), cellWithHook, h('input.aft', {}, [])]);
      patch(toVNode(document.querySelector('#calc')!), container);
    });
    it('it should react to ArrowLeft with selection not at start', () => {
      const doc = prepareFakeDom(html1);

      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');

      const cell = editableCell(data, aNode, 'name');
      const cellWithHook = addInsertHook(cell, (vnode) => {
        const myInput = vnode.elm as HTMLInputElement;
        expect(myInput.tagName).to.eql('INPUT');
        myInput.selectionStart = 1;
        myInput.selectionEnd = 1;
        myInput.focus();
        expect(doc.activeElement!.outerHTML).to.eql('<input class="editable" placeholder="<no name>" required="">');
        pressArrowLeft(myInput);
        expect(doc.activeElement!.outerHTML).to.eql('<input class="editable" placeholder="<no name>" required="">');
      });

      const container = h('div#calc.editor', {}, [h('input.bef', {}, []), cellWithHook, h('input.aft', {}, [])]);
      patch(toVNode(document.querySelector('#calc')!), container);
    });
    it('it should react to Backspace when at start', (done) => {
      const doc = prepareFakeDom(html1);

      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');

      const cell = editableCell(data, aNode, 'name');
      const cellWithHook = addInsertHook(cell, (vnode) => {
        const myInput = vnode.elm as HTMLInputElement;
        expect(myInput.tagName).to.eql('INPUT');
        myInput.selectionStart = 0;
        myInput.selectionEnd = 0;
        myInput.focus();
        expect(doc.activeElement!.outerHTML).to.eql('<input class="editable" placeholder="<no name>" required="">');
        pressBackspace(myInput);
        expect(myInput.parentElement!.outerHTML).to.eql(
          '<div class="represent-node deleting" data-node_represented="324292001770075100"><input class="editable" placeholder="<no name>" required=""></div>',
        );
        done();
      });

      const container = h('div#calc.editor', {}, [
        h('div.represent-node', { dataset: { node_represented: '324292001770075100' } }, [cellWithHook]),
      ]);
      patch(toVNode(document.querySelector('#calc')!), container);
    });
    it('it should react to Backspace when not at start', (done) => {
      const doc = prepareFakeDom(html1);

      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');

      const cell = editableCell(data, aNode, 'name');
      const cellWithHook = addInsertHook(cell, (vnode) => {
        const myInput = vnode.elm as HTMLInputElement;
        expect(myInput.tagName).to.eql('INPUT');
        myInput.selectionStart = 1;
        myInput.selectionEnd = 1;
        myInput.focus();
        expect(doc.activeElement!.outerHTML).to.eql('<input class="editable" placeholder="<no name>" required="">');
        // the backspace does not actually change the value
        // see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Auto-repeat_handling_prior_to_Gecko_5.0
        myInput.value = 'y calculations';
        pressBackspace(myInput);
        // We should not add the "deleting" class
        expect(myInput.parentElement!.outerHTML).to.eql(
          '<div class="represent-node" data-node_represented="324292001770075100"><input class="editable" placeholder="<no name>" required=""></div>',
        );
        done();
      });

      const container = h('div#calc.editor', {}, [
        h('div.represent-node', { dataset: { node_represented: '324292001770075100' } }, [cellWithHook]),
      ]);

      patch(toVNode(document.querySelector('#calc')!), container);
    });

    // Change property to 'foo' and then to 'foobar'. The only change request that should be received is to set the
    // value to 'foobar'.
    it('should consolidate change requests', (done) => {
      // @ts-ignore
      global.WebSocket = WebSocket;
      const mockServer = new Server(fakeURL);
      mockServer.on('connection', (socket) => {
        console.log('connected');
        let received = 0;
        socket.on('message', (data) => {
          console.log('received', data);
          received++;
          const parsed = JSON.parse(data as string);
          if (received === 2) {
            expect(parsed.propertyValue).to.eql('foobar');
            done();
          }
        });
      });
      createInstance(fakeURL, 'my.qualified.model', 'calc');

      prepareFakeDom(html1);

      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');

      const cell = editableCell(data, aNode, 'name');

      patch(toVNode(document.body), cell);

      const input = cell.elm as HTMLInputElement;
      input.value = 'foo';
      triggerInputEvent(input);
      input.value = 'foobar';
      triggerInputEvent(input);

      clock.tick(1000);
    });

    it('should have class emptyProperty when empty', () => {
      const aNode = dataToNode(rootData1);
      aNode.injectModelName('my.qualified.model', 'calc');

      const cell = editableCell(data, aNode, 'name');

      const doc = prepareFakeDom(html1);
      patch(toVNode(doc.body), cell);

      const input = cell.elm as HTMLInputElement;
      input.value = '';
      triggerInputEvent(input);

      expect(Array.from(input.classList)).to.contain('emptyProperty');

      input.value = 'foobar';
      triggerInputEvent(input);
      expect(Array.from(input.classList)).not.to.contain('emptyProperty');
    });
  });
});
