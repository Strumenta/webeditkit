import {dataToNode, ModelNode} from '../src/datamodel';
import { expect } from 'chai';
import 'mocha';
import {clearRendererRegistry, getRegisteredRenderer, renderModelNode} from "../src/renderer";
import {VNode} from "snabbdom/vnode";
import {h} from "snabbdom";
import {registerRenderer} from "../src/renderer";
import {childCell, fixedCell, horizontalCollectionCell, referenceCell, row, verticalCollectionCell} from "../src/cells";
import {flattenArray} from "../src/cells/support";

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

var init = require('snabbdom-to-html/init')
var modules = require('snabbdom-to-html/modules/index')
var toHTML = init([
    modules.class,
    modules.props,
    modules.attributes,
    modules.style
])

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

describe('Cells.Types', () => {

    describe('should support fixed cell', () => {
        it('it should be rendered in a certain way', () => {
            const aNode = dataToNode(rootData1);
            const cell = fixedCell(aNode, 'My fixed test');
            expect(toHTML(cell)).to.eql('<input class="fixed" value="My fixed test">');
        })
    });

    describe('should support reference cell', () => {
        it('it should be rendered in a certain way when null', () => {
            const rootNode = dataToNode(rootData1);
            const inputNode = rootNode.childrenByLinkName('inputs')[0];
            const cell = referenceCell(inputNode, 'type');
            expect(toHTML(cell)).to.equal('<input class="fixed empty-reference" value="&lt;no type&gt;">');
        })
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
        it('it should be rendered in a certain way', () => {
            const aNode = dataToNode(rootData1);
            const cell = childCell(aNode.childrenByLinkName('inputs')[0], 'type');
            expect(toHTML(cell)).to.eql('<input class="fixed default-cell-concrete represent-node" value="[default BooleanType]">');
        })
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

});