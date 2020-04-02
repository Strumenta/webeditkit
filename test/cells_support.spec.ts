import {dataToNode, ModelNode} from '../src/datamodel';
import { expect } from 'chai';
import 'mocha';
import {VNode} from "snabbdom/vnode";
import {fixedCell, map, referenceCell, row} from "../src/cells";
import {addId, addInsertHook, flattenArray, separate, setDataset} from "../src/cells/support";

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

var init2html = require('snabbdom-to-html/init')
var modules = require('snabbdom-to-html/modules/index')
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
import {focusOnNode} from "../dist/cells/support";

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

    // describe('should support focusOnNode', () => {
    //     it('it should be triggered', (done) => {
    //         const dom = new JSDOM(html1);
    //         const doc = dom.window.document;
    //         // @ts-ignore
    //         global.$ = require('jquery')(dom.window);
    //         // @ts-ignore
    //         global.document = doc;
    //
    //         const aNode = dataToNode(rootData1);
    //         let cell = fixedCell(aNode, 'My fixed test');
    //         let cellWithHook = setDataset(addInsertHook(cell, (myNode) => {
    //             focusOnNode('my-node-id', 'root-x');
    //             //done();
    //         }), {node_represented:'my-node-id'});
    //         patch(toVNode(document.querySelector('#calc')), cellWithHook);
    //     });
    // });

});