import {dataToNode, ModelNode} from '../src/datamodel';
import { expect } from 'chai';
import 'mocha';
import {VNode} from "snabbdom/vnode";
import {addClass, alternativesProviderForAbstractConcept, fixedCell, map, referenceCell, row} from "../src/cells";
import {
    addId,
    addInsertHook,
    alternativesProviderForAddingChild, AutocompleteAlternative,
    flattenArray, handleSelfDeletion, installAutocomplete,
    separate,
    setDataset, SuggestionsReceiver
} from "../src/cells/support";

import { WebSocket, Server } from 'mock-socket';

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const wscommunication = require("../src/wscommunication");

var init2html = require('snabbdom-to-html/init');
var modules = require('snabbdom-to-html/modules/index');
var toHTML = init2html([
    modules.class,
    modules.props,
    modules.attributes,
    modules.style,
    modules.dataset
]);

import { init } from 'snabbdom/snabbdom';

import h from 'snabbdom/h'; // helper function for creating vnodes

import toVNode from 'snabbdom/tovnode';

import * as sclass from 'snabbdom/modules/class';
import * as sprops from 'snabbdom/modules/props';
import * as sstyle from 'snabbdom/modules/style';
import * as seventlisteners from 'snabbdom/modules/eventlisteners';
import * as sdataset from 'snabbdom/modules/dataset';
import {focusOnNode} from "../src/cells/support";
import {installAutoresize} from "../src/uiutils";
import {createInstance} from "../src/wscommunication";
import {compareVNodes} from "./testutils";

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

describe('Cells.Support', () => {

    describe('should support setDataset', () => {
        it('it should be rendered in a certain way', () => {
            const aNode = dataToNode(rootData1);
            let cell = fixedCell(aNode, 'My fixed test');
            expect(toHTML(cell)).to.eql('<input class="fixed" value="My fixed test">');
            cell = setDataset(cell, {a: 123});
            expect(toHTML(cell)).to.eql('<input class="fixed" value="My fixed test" data-a="123">');
        })
    });

    describe('should support addId', () => {
        it('it should be rendered in a certain way', () => {
            const aNode = dataToNode(rootData1);
            let cell = fixedCell(aNode, 'My fixed test');
            expect(toHTML(cell)).to.eql('<input class="fixed" value="My fixed test">');
            cell = addId(cell, 'spritz');
            expect(toHTML(cell)).to.eql('<input id="spritz" class="fixed" value="My fixed test">');
        })
    });

    describe('should support map', () => {
        it('it should be rendered in a certain way', () => {
            const aNode = dataToNode(rootData1);
            const res = map(['a', 'b', 'c'], (el)=>{return fixedCell(aNode, el)});
            expect(res.length).to.eql(3);
            compareVNodes(res[0] as VNode, fixedCell(aNode, 'a'));
            compareVNodes(res[1] as VNode, fixedCell(aNode, 'b'));
            compareVNodes(res[2] as VNode, fixedCell(aNode, 'c'));
        })
    });

    describe('should support separate', () => {
        it('it should be rendered in a certain way an empty list with no separator', () => {
            const aNode = dataToNode(rootData1);
            const res = separate([]);
            expect(res.length).to.eql(0);
        });
        it('it should be rendered in a certain way an empty list with separator', () => {
            const aNode = dataToNode(rootData1);
            const res = separate([], ()=>{ return fixedCell(aNode, ","); });
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
            const res = separate([fixedCell(aNode, 'a'), fixedCell(aNode, 'b')],()=>{ return fixedCell(aNode, ","); });
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
            global.$ = require('jquery')(dom.window);
            // @ts-ignore
            global.document = doc;

            const aNode = dataToNode(rootData1);
            let cell = fixedCell(aNode, 'My fixed test');
            let cellWithHook = addInsertHook(cell, (myNode) => {
                compareVNodes(myNode, cellWithHook);
                done();
            });
            patch(toVNode(document.querySelector('#calc')), cellWithHook);
        });
    });

    describe('should support focusOnNode', () => {
        it('it should be triggered', (done) => {
            const dom = new JSDOM(html1);
            const doc = dom.window.document;
            // @ts-ignore
            global.window = dom.window;
            // @ts-ignore
            global.$ = require('jquery')(dom.window);
            // @ts-ignore
            global.document = doc;
            installAutoresize();

            const aNode = dataToNode(rootData1);
            let cell =  fixedCell(aNode, 'My fixed test');
            let cellWithHook = addClass(setDataset(addInsertHook(cell, (myNode) => {
                focusOnNode('my-node-id', 'calc');
                // We need to check who has the focus
                expect(doc.activeElement.tagName).to.equals('INPUT');
                expect(doc.activeElement.className).to.equals('fixed represent-node');
                expect(doc.activeElement.dataset.node_represented).to.eql('my-node-id');
                done();
            }), {node_represented:'my-node-id'}), 'represent-node');
            let container = h('div#calc', {}, [cellWithHook]);
            patch(toVNode(document.querySelector('#calc')), container);
        });
    });

    describe('should support alternativesProviderForAddingChild', () => {
        it('it should handle positive case', (done) => {
            let received = 0;
            const fakeURL = 'ws://localhost:8080';
            const mockServer = new Server(fakeURL);
            mockServer.on('connection', socket => {
                socket.on('message', data => {
                    if (received == 0) {
                        const dataj = JSON.parse(data as string);
                        expect(dataj.type).to.eql('askAlternatives');
                        expect(dataj.containmentName).to.eql('foo');
                        expect(dataj.nodeId).to.eql('324292001770075100');
                        expect(dataj.modelName).to.eql('my.qualified.model');
                        const requestId = dataj.requestId;

                        socket.send(JSON.stringify({
                            type: 'AnswerAlternatives',
                            requestId: requestId,
                            items: [
                                {alias:'alias1', conceptName:'foo.bar.concept1'},
                                {alias:'alias2', conceptName:'foo.bar.concept2'}
                                ]
                        }));
                    } else if (received == 1) {
                        expect(JSON.parse(data as string)).to.eql({"type":"registerForChanges","modelName":"my.qualified.model"});
                    } else if (received == 2) {
                        expect(JSON.parse(data as string)).to.eql({"type":"addChild","index":-1,"modelName":"my.qualified.model","container":"324292001770075100","containmentName":"foo","conceptToInstantiate":"foo.bar.concept1"});
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
            const aNode = dataToNode(rootData1);
            aNode.injectModelName('my.qualified.model', 'calc');
            const suggestionsReceiverFactory = alternativesProviderForAddingChild(aNode, 'foo');
            suggestionsReceiverFactory((suggestions: AutocompleteAlternative[]) : void => {
               expect(suggestions.length).to.equals(2);
                expect(suggestions[0].label).to.eql('alias1');
                expect(suggestions[1].label).to.eql('alias2');
                suggestions[0].execute();

            });
        });
        it('it should handle case in which modelNode is null', (done) => {
            let received = 0;
            const fakeURL = 'ws://localhost:8080';
            const mockServer = new Server(fakeURL);
            mockServer.on('connection', socket => {
                socket.on('message', data => {
                    if (received == 0) {
                        expect(JSON.parse(data as string)).to.eql({"type":"registerForChanges","modelName":"my.qualified.model"});
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
            expect(() => {alternativesProviderForAddingChild(null, 'foo');}).to.throw('modelNode should not be null');
            mockServer.close();
            done();
        });
    });

    describe('should support alternativesProviderForAbstractConcept', () => {
        it('it should handle positive case', (done) => {
            let received = 0;
            const fakeURL = 'ws://localhost:8080';
            const mockServer = new Server(fakeURL);
            mockServer.on('connection', socket => {
                socket.on('message', data => {
                    if (received == 0) {
                        const dataj = JSON.parse(data as string);
                        expect(dataj.type).to.eql('askAlternatives');
                        expect(dataj.containmentName).to.eql('type');
                        expect(dataj.nodeId).to.eql('1848360241685547698');
                        expect(dataj.modelName).to.eql('my.qualified.model');
                        const requestId = dataj.requestId;

                        socket.send(JSON.stringify({
                            type: 'AnswerAlternatives',
                            requestId: requestId,
                            items: [
                                {alias:'alias1', conceptName:'foo.bar.concept1'},
                                {alias:'alias2', conceptName:'foo.bar.concept2'}
                            ]
                        }));
                    } else if (received == 1) {
                        expect(JSON.parse(data as string)).to.eql({"type":"registerForChanges","modelName":"my.qualified.model"});
                    } else if (received == 2) {
                        expect(JSON.parse(data as string)).to.eql({"type":"setChild","modelName":"my.qualified.model","container":"1848360241685547698","containmentName":"type","conceptToInstantiate":"foo.bar.concept1"});
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
            const aNode = dataToNode(rootData1);
            aNode.injectModelName('my.qualified.model', 'calc');
            const suggestionsReceiverFactory = alternativesProviderForAbstractConcept(aNode.childrenByLinkName('inputs')[0].childByLinkName('type'));
            suggestionsReceiverFactory((suggestions: AutocompleteAlternative[]) : void => {
                expect(suggestions.length).to.equals(2);
                expect(suggestions[0].label).to.eql('alias1');
                expect(suggestions[1].label).to.eql('alias2');
                suggestions[0].execute();
            });
        });
        it('it should handle case with parent not set', (done) => {
            let received = 0;
            const fakeURL = 'ws://localhost:8080';
            const mockServer = new Server(fakeURL);
            mockServer.on('connection', socket => {
                socket.on('message', data => {
                    if (received == 0) {
                        expect(JSON.parse(data as string)).to.eql({"type":"registerForChanges","modelName":"my.qualified.model"});
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
            expect(() => {alternativesProviderForAbstractConcept(aNode);}).to.throw('The given node has no parent');
            mockServer.close();
            done();
        });
    });

    describe('should support installAutocomplete', () => {
        it('it should handle positive case', (done) => {
            const dom = new JSDOM(html1);
            const doc = dom.window.document;
            // @ts-ignore
            global.window = dom.window;
            // @ts-ignore
            global.$ = require('jquery')(dom.window);
            // @ts-ignore
            global.document = doc;
            // @ts-ignore
            global.navigator = {'userAgent': 'fake browser'};
            //installAutoresize();

            const aNode = dataToNode(rootData1);
            let cell =  h('input', {}, []);
            let cellWithHook = addInsertHook(cell, (myNode:VNode) => {
                installAutocomplete(myNode, (suggestionsReceiver: SuggestionsReceiver) => {
                    suggestionsReceiver([
                        {
                            label: 'xyz',
                            execute: () => {
                                console.log('executing');
                            }
                        }
                    ]);
                    done();
                },true);
                // @ts-ignore
                myNode.elm.focus();

                const pressChar = (ch: string, val: number) => {
                    // @ts-ignore
                    doc.activeElement.dispatchEvent(new dom.window.KeyboardEvent("keydown", {key: ch, char: ch, keyCode: val, bubbles: true })); // x
                    // @ts-ignore
                    doc.activeElement.dispatchEvent(new dom.window.KeyboardEvent("keyup", {key: ch, char: ch, keyCode: val })); // x
                };
                pressChar("x", 88);

            });

            let container = h('div#calc', {}, [cellWithHook]);
            patch(toVNode(document.querySelector('#calc')), container);
        });
    });

    describe('should support handleSelfDeletion', () => {
        it('it should handle marking with deleting class', (done) => {
            const dom = new JSDOM(html1);
            const doc = dom.window.document;
            // @ts-ignore
            global.window = dom.window;
            // @ts-ignore
            global.$ = require('jquery')(dom.window);
            // @ts-ignore
            global.document = doc;
            // @ts-ignore
            global.navigator = {'userAgent': 'fake browser'};
            //installAutoresize();

            const aNode = dataToNode(rootData1);
            let cell =  fixedCell(aNode, 'myFixedCell');
            let cellWithHook = addClass(addInsertHook(cell, (myNode:VNode) => {
                // @ts-ignore
                expect(myNode.elm.className).to.eql("fixed represent-node");
                handleSelfDeletion(myNode.elm, aNode);
                // @ts-ignore
                expect(myNode.elm.className).to.eql("fixed represent-node deleting");
                done();
            }), 'represent-node');

            let container = h('div#calc', {}, [cellWithHook]);
            patch(toVNode(document.querySelector('#calc')), container);
        });
    });

    describe('should support handleSelfDeletion', () => {
        it('it should handle triggering deleteMe', (done) => {
            let received = 0;
            const fakeURL = 'ws://localhost:8080';
            const mockServer = new Server(fakeURL);
            mockServer.on('connection', socket => {
                socket.on('message', data => {
                    if (received == 0) {
                        expect(JSON.parse(data as string)).to.eql({"type":"deleteNode","modelName":"my.qualified.model", "node": "324292001770075100"});
                        mockServer.close();
                        done();
                    }  else if (received == 1) {
                        expect(JSON.parse(data as string)).to.eql({"type":"registerForChanges","modelName":"my.qualified.model"});
                        // actually the test will be finished at this point...
                    } else {
                        throw new Error('Too many messages');
                    }
                    received += 1;
                });
            });
            // @ts-ignore
            global.WebSocket = WebSocket;
            createInstance(fakeURL, 'my.qualified.model', 'calc');

            const dom = new JSDOM(html1);
            const doc = dom.window.document;
            // @ts-ignore
            global.window = dom.window;
            // @ts-ignore
            global.$ = require('jquery')(dom.window);
            // @ts-ignore
            global.document = doc;
            // @ts-ignore
            global.navigator = {'userAgent': 'fake browser'};
            //installAutoresize();

            const aNode = dataToNode(rootData1);
            aNode.injectModelName('my.qualified.model', 'calc');
            let cell =  fixedCell(aNode, 'myFixedCell');
            let cellWithHook = addClass(addInsertHook(cell, (myNode:VNode) => {
                // @ts-ignore
                expect(myNode.elm.className).to.eql("fixed represent-node");
                handleSelfDeletion(myNode.elm, aNode);
                handleSelfDeletion(myNode.elm, aNode);
                // @ts-ignore
                expect(myNode.elm.className).to.eql("fixed represent-node deleting");
                //done();
            }), 'represent-node');

            let container = h('div#calc', {}, [cellWithHook]);
            patch(toVNode(document.querySelector('#calc')), container);
        });
    });

});