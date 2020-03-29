import {dataToNode, ModelNode} from '../src/datamodel';
import { expect } from 'chai';
import 'mocha';
import {clearRendererRegistry, getRegisteredRenderer, renderModelNode} from "../src/renderer";
import {VNode} from "snabbdom/vnode";
import {h} from "snabbdom";
import {registerRenderer} from "../src/renderer";

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

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

describe('Renderer', () => {

    it('should support renderer registry - negative case', () => {
       expect(getRegisteredRenderer('concept.without.renderer')).to.equals(undefined);
    });

    it('should support renderer registry - positive case', () => {
        const myDummyRenderer1 = (modelNode: ModelNode) : VNode => { return h('span.foo'); }
        const myDummyRenderer2 = (modelNode: ModelNode) : VNode => { return h('span.bar'); }
        const myDummyRenderer3 = (modelNode: ModelNode) : VNode => { return h('span.zum'); }

        registerRenderer('concept.with.renderer', myDummyRenderer2);

        const n = dataToNode(rootData1);

        expect(getRegisteredRenderer('concept.with.renderer')(n)).to.eql(h('span.bar'));
        expect(getRegisteredRenderer('concept.with.renderer')(n)).not.eql(h('span.foo'));
        expect(getRegisteredRenderer('concept.with.renderer')(n)).not.eql(h('span.zum'));
    });

    it('should support clearRendererRegistry', () => {
        const myDummyRenderer2 = (modelNode: ModelNode) : VNode => { return h('span.zum'); }
        registerRenderer('concept.with.renderer', myDummyRenderer2);
        expect(getRegisteredRenderer('concept.with.renderer')).not.equals(undefined);
        clearRendererRegistry();
        expect(getRegisteredRenderer('concept.with.renderer')).to.equals(undefined);
    });

    it('should support getRenderer - using default renderer', () => {
        const n = dataToNode(rootData1);

        clearRendererRegistry();
        const rendered = renderModelNode(n);
        const expectedRendered = h('input.fixed.default-cell-concrete.represent-node', {
            key: '324292001770075100',
            dataset: {
                node_represented: '324292001770075100'
            },
            props: {
                value: '[default FinancialCalcSheet]'
            }
        }, []);
        compareVNodes(rendered, expectedRendered);
    });

    it('should support getRenderer - using registered renderer', () => {
        const r = (modelNode: ModelNode) : VNode => { return h('span.bar', {}, [modelNode.name()]); }

        registerRenderer('com.strumenta.financialcalc.FinancialCalcSheet', r);

        const n = dataToNode(rootData1);
        const rendered = renderModelNode(n);
        const expectedRendered = h('span.bar.represent-node', {
            key: '324292001770075100',
            dataset: {
                node_represented: '324292001770075100'
            }
        }, ['My calculations']);
        compareVNodes(rendered, expectedRendered);
    });

});