import {dataToNode, NodeData} from '../src/datamodel';
import { expect } from 'chai';
import 'mocha';
import {VNode} from "snabbdom/vnode";
import {
    childCell, editableCell, emptyRow,
    fixedCell,
    horizontalCollectionCell,
    horizontalGroupCell,
    referenceCell,
    row, tabCell,
    verticalCollectionCell, verticalGroupCell
} from "../src/cells";
import {addInsertHook, flattenArray} from "../src/cells/support";

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

var toHtmlInit = require('snabbdom-to-html/init');
var modules = require('snabbdom-to-html/modules/index');
var toHTML = toHtmlInit([
    modules.class,
    modules.props,
    modules.attributes,
    modules.style
]);

import { init } from 'snabbdom/snabbdom';

import h from 'snabbdom/h'; // helper function for creating vnodes

import toVNode from 'snabbdom/tovnode';

import * as sclass from 'snabbdom/modules/class';
import * as sprops from 'snabbdom/modules/props';
import * as sstyle from 'snabbdom/modules/style';
import * as seventlisteners from 'snabbdom/modules/eventlisteners';
import * as sdataset from 'snabbdom/modules/dataset';
import {installAutoresize} from "../src/uiutils";
import {createInstance} from "../src/wscommunication";
import {Server, WebSocket} from "mock-socket";
import {prepareFakeDom, pressArrowLeft, pressArrowRight} from "./testutils";

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

function compareVNodes(rendered: VNode, expectedRendered: VNode) : void {
    expect(rendered.sel).to.eql(expectedRendered.sel);
    expect(rendered.data.props).to.eql(expectedRendered.data.props);
    expect(rendered.data.dataset).to.eql(expectedRendered.data.dataset);
    expect(rendered.children).deep.equal(expectedRendered.children);
    expect(rendered.key).to.eql(expectedRendered.key);
    expect(rendered.text).to.eql(expectedRendered.text);
}

const rootData1 = {
    "children": [
        {
            "containingLink": "inputs",
            "children": [
                {
                    "containingLink": "type",
                    "children": [],
                    "properties": {},
                    "refs": {},
                    "id": {
                        "regularId": "1848360241685547702"
                    },
                    "concept": "com.strumenta.financialcalc.BooleanType",
                    "abstractConcept": false
                }
            ],
            "properties": {
                "name": "a"
            },
            "refs": {},
            "id": {
                "regularId": "1848360241685547698"
            },
            "name": "a",
            "concept": "com.strumenta.financialcalc.Input",
            "abstractConcept": false
        },
        {
            "containingLink": "inputs",
            "children": [
                {
                    "containingLink": "type",
                    "children": [],
                    "properties": {},
                    "refs": {},
                    "id": {
                        "regularId": "1848360241685547711"
                    },
                    "concept": "com.strumenta.financialcalc.StringType",
                    "abstractConcept": false
                }
            ],
            "properties": {
                "name": "b"
            },
            "refs": {},
            "id": {
                "regularId": "1848360241685547705"
            },
            "name": "b",
            "concept": "com.strumenta.financialcalc.Input",
            "abstractConcept": false
        }
    ],
    "properties": {
        "name": "My calculations"
    },
    "refs": {},
    "id": {
        "regularId": "324292001770075100"
    },
    "name": "My calculations",
    "concept": "com.strumenta.financialcalc.FinancialCalcSheet",
    "abstractConcept": false
};

const rootData2 = {
    "children": [
        {
            "containingLink": "inputs",
            "children": [
            ],
            "properties": {
                "name": "a"
            },
            "refs": {},
            "id": {
                "regularId": "1848360241685547698"
            },
            "name": "a",
            "concept": "com.strumenta.financialcalc.Input",
            "abstractConcept": false
        },
        {
            "containingLink": "inputs",
            "children": [
                {
                    "containingLink": "type",
                    "children": [],
                    "properties": {},
                    "refs": {},
                    "id": {
                        "regularId": "1848360241685547711"
                    },
                    "concept": "com.strumenta.financialcalc.StringType",
                    "abstractConcept": false
                }
            ],
            "properties": {
                "name": "b"
            },
            "refs": {},
            "id": {
                "regularId": "1848360241685547705"
            },
            "name": "b",
            "concept": "com.strumenta.financialcalc.Input",
            "abstractConcept": false
        }
    ],
    "properties": {
        "name": "My calculations"
    },
    "refs": {},
    "id": {
        "regularId": "324292001770075100"
    },
    "name": "My calculations",
    "concept": "com.strumenta.financialcalc.FinancialCalcSheet",
    "abstractConcept": false
};

const rootData3 : NodeData = {
    "children": [
        {
            "containingLink": "inputs",
            "children": [
            ],
            "properties": {
                "name": "a"
            },
            "refs": {},
            "id": {
                "regularId": "1848360241685547698"
            },
            //"name": "a",
            "concept": "com.strumenta.financialcalc.Input",
            "abstractConcept": false
        },
        {
            "containingLink": "inputs",
            "children": [
                {
                    "containingLink": "type",
                    "children": [],
                    "properties": {},
                    "refs": {'myref':{
                        model: {
                            qualifiedName: 'my.qualified.model'
                        },
                            id: {
                                regularId: '123-foo'
                            }
                        }},
                    "id": {
                        "regularId": "1848360241685547711"
                    },
                    "concept": "com.strumenta.financialcalc.StringType",
                    "abstractConcept": false
                }
            ],
            "properties": {
                "name": "b"
            },
            "refs": {},
            "id": {
                "regularId": "1848360241685547705"
            },
            "concept": "com.strumenta.financialcalc.Input",
            "abstractConcept": false
        }
    ],
    "properties": {
        "name": "My calculations"
    },
    "refs": {},
    "id": {
        "regularId": "324292001770075100"
    },
    "concept": "com.strumenta.financialcalc.FinancialCalcSheet",
    "abstractConcept": false
};

describe('Cells.Types', () => {

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
                let myInput = vnode.elm;
                expect(myInput.tagName).to.eql('INPUT');
                myInput.selectionStart = 1;
                myInput.selectionEnd = 1;
                myInput.focus();
                expect(doc.activeElement.outerHTML).to.eql('<input class="fixed">');
                pressArrowLeft(myInput);
                expect(doc.activeElement.outerHTML).to.eql('<input class="bef">');
                done();
            });

            let container = h('div#calc.editor', {}, [
                h('input.bef', {}, []),
                cellWithHook,
                h('input.aft', {}, [])]);
            patch(toVNode(document.querySelector('#calc')), container);
        });
        it('it should handle right arrow', (done) => {
            const doc = prepareFakeDom(html1);

            const aNode = dataToNode(rootData1);
            aNode.injectModelName('my.qualified.model', 'calc');

            const cell = fixedCell(aNode, 'My fixed cell');
            const cellWithHook = addInsertHook(cell, (vnode) => {
                let myInput = vnode.elm;
                expect(myInput.tagName).to.eql('INPUT');
                myInput.selectionStart = 1;
                myInput.selectionEnd = 1;
                myInput.focus();
                expect(doc.activeElement.outerHTML).to.eql('<input class="fixed">');
                pressArrowRight(myInput);
                expect(doc.activeElement.outerHTML).to.eql('<input class="aft">');
                done();
            });

            let container = h('div#calc.editor', {}, [
                h('input.bef', {}, []),
                cellWithHook,
                h('input.aft', {}, [])]);
            patch(toVNode(document.querySelector('#calc')), container);
        });
    });

    describe('should support reference cell', () => {
        it('it should be rendered in a certain way when null', () => {
            const rootNode = dataToNode(rootData1);
            const inputNode = rootNode.childrenByLinkName('inputs')[0];
            const cell = referenceCell(inputNode, 'type');
            expect(toHTML(cell)).to.equal('<input class="fixed empty-reference" value="&lt;no type&gt;">');
        });
        it('it should handle left arrow', (done) => {
            const doc = prepareFakeDom(html1);

            const aNode = dataToNode(rootData1);
            aNode.injectModelName('my.qualified.model', 'calc');

            const inputNode = aNode.childrenByLinkName('inputs')[0];
            const cell = referenceCell(inputNode, 'type');

            const cellWithHook = addInsertHook(cell, (vnode) => {
                let myInput = vnode.elm;
                expect(myInput.tagName).to.eql('INPUT');
                myInput.selectionStart = 1;
                myInput.selectionEnd = 1;
                myInput.focus();
                expect(doc.activeElement.outerHTML).to.eql('<input class="fixed empty-reference">');
                pressArrowLeft(myInput);
                expect(doc.activeElement.outerHTML).to.eql('<input class="bef">');
                done();
            });

            let container = h('div#calc.editor', {}, [
                h('input.bef', {}, []),
                cellWithHook,
                h('input.aft', {}, [])]);
            patch(toVNode(document.querySelector('#calc')), container);
        });
        it('it should handle right arrow', (done) => {
            const doc = prepareFakeDom(html1);

            const aNode = dataToNode(rootData1);
            aNode.injectModelName('my.qualified.model', 'calc');

            const inputNode = aNode.childrenByLinkName('inputs')[0];
            const cell = referenceCell(inputNode, 'type');

            const cellWithHook = addInsertHook(cell, (vnode) => {
                let myInput = vnode.elm;
                expect(myInput.tagName).to.eql('INPUT');
                myInput.selectionStart = 1;
                myInput.selectionEnd = 1;
                myInput.focus();
                expect(doc.activeElement.outerHTML).to.eql('<input class="fixed empty-reference">');
                pressArrowRight(myInput);
                expect(doc.activeElement.outerHTML).to.eql('<input class="aft">');
                done();
            });

            let container = h('div#calc.editor', {}, [
                h('input.bef', {}, []),
                cellWithHook,
                h('input.aft', {}, [])]);
            patch(toVNode(document.querySelector('#calc')), container);
        });
        // it('it should load value', (done) => {
        //     const doc = prepareFakeDom(html1);
        //
        //     const aNode = dataToNode(rootData3);
        //     aNode.injectModelName('my.qualified.model', 'calc');
        //
        //     const inputNode = aNode.childrenByLinkName('inputs')[1];
        //     const cell = referenceCell(inputNode, 'myref');
        //     expect(toHTML(cell)).to.equal('<input class="fixed empty-reference" value="&lt;no myref&gt;">');
        //     let container = h('div#calc.editor', {}, [
        //         h('input.bef', {}, []),
        //         cell,
        //         h('input.aft', {}, [])]);
        //     patch(toVNode(document.querySelector('#calc')), container);
        // });
    });

    describe('should support row cell', () => {
        it('it should be rendered in a certain way', () => {
            const aNode = dataToNode(rootData1);
            const cell = row(fixedCell(aNode, 'a'), fixedCell(aNode, 'b'));
            expect(toHTML(cell)).to.eql('<div class="row"><input class="fixed" value="a"><input class="fixed" value="b"></div>');
        })
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
            expect(toHTML(cell)).to.eql('<input class="fixed default-cell-concrete represent-node" value="[default BooleanType]">');
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
            expect(toHTML(cell)).to.eql('<div class="vertical-collection represent-collection"><div class="row"><input class="fixed default-cell-concrete represent-node" value="[default Input]"></div><div class="row"><input class="fixed default-cell-concrete represent-node" value="[default Input]"></div></div>');
        });
        it('it should be rendered in a certain way for not empty children not wrapping in rows', () => {
            const aNode = dataToNode(rootData1);
            const cell = verticalCollectionCell(aNode, 'inputs', false);
            expect(toHTML(cell)).to.eql('<div class="vertical-collection represent-collection"><input class="fixed default-cell-concrete represent-node" value="[default Input]"><input class="fixed default-cell-concrete represent-node" value="[default Input]"></div>');
        });
        it('it should be rendered in a certain way for empty children', () => {
            const aNode = dataToNode(rootData1);
            const cell = verticalCollectionCell(aNode, 'unexisting');
            expect(toHTML(cell)).to.eql('<div class="vertical-collection represent-collection"><input class="fixed empty-collection" value="&lt;&lt; ... &gt;&gt;"></div>');
        });
        it('when empty it should react to enter in a certain way', (done) => {
            const dom = new JSDOM(html1);
            const doc = dom.window.document;
            // @ts-ignore
            global.window = dom.window;
            try {
                // @ts-ignore
                global.$ = require('jquery');
                // @ts-ignore
                global.$("a");
            } catch (e) {
                // @ts-ignore
                global.$ = require('jquery')(dom.window);
            }
            // @ts-ignore
            global.document = doc;
            // @ts-ignore
            global.navigator = {'userAgent': 'fake browser'};
            installAutoresize();

            const aNode = dataToNode(rootData1);
            aNode.injectModelName('my.qualified.model', 'calc');

            let received = 0;
            const fakeURL = 'ws://localhost:8080';
            const mockServer = new Server(fakeURL);
            mockServer.on('connection', socket => {
                socket.on('message', data => {
                    if (received == 0) {
                        const dataj = JSON.parse(data as string);
                        expect(dataj.type).to.eql('defaultInsertion');
                        expect(dataj.containmentName).to.eql('unexisting');
                        expect(dataj.container).to.eql('324292001770075100');
                        expect(dataj.modelName).to.eql('my.qualified.model');
                    } else if (received == 1) {
                        expect(JSON.parse(data as string)).to.eql({"type":"registerForChanges","modelName":"my.qualified.model"});
                        mockServer.close();
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

            const cell = verticalCollectionCell(aNode, 'unexisting');
            const cellWithHook = addInsertHook(cell, (vnode) => {
                let myInput = vnode.elm.firstChild;
                expect(myInput.tagName).to.eql('INPUT');
                // @ts-ignore
                myInput.dispatchEvent(new dom.window.KeyboardEvent("keydown", {code: 'Enter',
                    key: 'Enter',
                    charKode: 13,
                    keyCode: 13,})); // x
                // @ts-ignore
                myInput.dispatchEvent(new dom.window.KeyboardEvent("keyup", {code: 'Enter',
                    key: 'Enter',
                    charKode: 13,
                    keyCode: 13,})); // x
            });

            let container = h('div#calc', {}, [cellWithHook]);
            patch(toVNode(document.querySelector('#calc')), container);
        });
    });

    describe('should support horizontalCollectionCell', () => {
        it('it should be rendered in a certain way for not empty children', () => {
            const aNode = dataToNode(rootData1);
            const cell = horizontalCollectionCell(aNode, 'inputs');
            expect(toHTML(cell)).to.eql('<div class="horizontal-collection"><input class="fixed default-cell-concrete represent-node" value="[default Input]"><input class="fixed default-cell-concrete represent-node" value="[default Input]"></div>');
        });
        it('it should be rendered in a certain way for empty children', () => {
            const aNode = dataToNode(rootData1);
            const cell = horizontalCollectionCell(aNode, 'unexisting');
            expect(toHTML(cell)).to.eql('<div class="horizontal-collection"><input class="fixed empty-collection" value="&lt;&lt; ... &gt;&gt;"></div>');
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
        it('it should be rendered in a certain way', () => {
            const aNode = dataToNode(rootData1);
            const cell = editableCell(aNode, 'name');
            expect(toHTML(cell)).to.eql('<input class="editable" value="My calculations" placeholder="&lt;no name&gt;" required="true">');
        });
        it('it should react to ArrowRight', () => {
            const dom = new JSDOM(html1);
            const doc = dom.window.document;
            // @ts-ignore
            global.window = dom.window;
            // @ts-ignore
            global.$ = require('jquery');
            try {
                $("a");
            } catch {
                // @ts-ignore
                global.$ = require('jquery')(dom.window);
            }
            // @ts-ignore
            global.document = doc;
            // @ts-ignore
            global.navigator = {'userAgent': 'fake browser'};
            installAutoresize();

            const aNode = dataToNode(rootData1);
            aNode.injectModelName('my.qualified.model', 'calc');

            const cell = editableCell(aNode, 'name');
            const cellWithHook = addInsertHook(cell, (vnode) => {
                let myInput = vnode.elm;
                expect(myInput.tagName).to.eql('INPUT');
                myInput.focus();
                expect(doc.activeElement.outerHTML).to.eql('<input class="editable" placeholder="<no name>" required="">');
                pressArrowRight(myInput);
                expect(doc.activeElement.outerHTML).to.eql('<input class="aft">');
            });

            let container = h('div#calc.editor', {}, [
                h('input.bef', {}, []),
                cellWithHook,
                h('input.aft', {}, [])]);
            patch(toVNode(document.querySelector('#calc')), container);
        });
        it('it should react to ArrowLeft with selection at start', () => {
            const dom = new JSDOM(html1);
            const doc = dom.window.document;
            // @ts-ignore
            global.window = dom.window;
            // @ts-ignore
            global.$ = require('jquery');
            try {
                $("a");
            } catch {
                // @ts-ignore
                global.$ = require('jquery')(dom.window);
            }
            // @ts-ignore
            global.document = doc;
            // @ts-ignore
            global.navigator = {'userAgent': 'fake browser'};
            installAutoresize();

            const aNode = dataToNode(rootData1);
            aNode.injectModelName('my.qualified.model', 'calc');

            const cell = editableCell(aNode, 'name');
            const cellWithHook = addInsertHook(cell, (vnode) => {
                let myInput = vnode.elm;
                expect(myInput.tagName).to.eql('INPUT');
                myInput.selectionStart = 0;
                myInput.selectionEnd = 0;
                myInput.focus();
                expect(doc.activeElement.outerHTML).to.eql('<input class="editable" placeholder="<no name>" required="">');
                // https://css-tricks.com/snippets/javascript/javascript-keycodes/
                // @ts-ignore
                myInput.dispatchEvent(new dom.window.KeyboardEvent("keydown", {code: 'ArrowLeft',
                    key: 'ArrowLeft',
                    charKode: 37,
                    keyCode: 37,})); // x
                // @ts-ignore
                myInput.dispatchEvent(new dom.window.KeyboardEvent("keyup", {code: 'ArrowLeft',
                    key: 'ArrowLeft',
                    charKode: 37,
                    keyCode: 37,})); // x
                expect(doc.activeElement.outerHTML).to.eql('<input class="bef">');
            });

            let container = h('div#calc.editor', {}, [
                h('input.bef', {}, []),
                cellWithHook,
                h('input.aft', {}, [])]);
            patch(toVNode(document.querySelector('#calc')), container);
        });
        it('it should react to ArrowLeft with selection not at start', () => {
            const doc = prepareFakeDom(html1);

            const aNode = dataToNode(rootData1);
            aNode.injectModelName('my.qualified.model', 'calc');

            const cell = editableCell(aNode, 'name');
            const cellWithHook = addInsertHook(cell, (vnode) => {
                let myInput = vnode.elm;
                expect(myInput.tagName).to.eql('INPUT');
                myInput.selectionStart = 1;
                myInput.selectionEnd = 1;
                myInput.focus();
                expect(doc.activeElement.outerHTML).to.eql('<input class="editable" placeholder="<no name>" required="">');
                pressArrowLeft(myInput);
                expect(doc.activeElement.outerHTML).to.eql('<input class="editable" placeholder="<no name>" required="">');
            });

            let container = h('div#calc.editor', {}, [
                h('input.bef', {}, []),
                cellWithHook,
                h('input.aft', {}, [])]);
            patch(toVNode(document.querySelector('#calc')), container);
        });
    });

});