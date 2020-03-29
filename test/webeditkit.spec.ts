import {
    registerDataModelClass,
    dataToNode,
    ModelNode,
    NodeData,
    Ref,
    setDatamodelRoot,
    clearDatamodelRoots
} from '../src/datamodel';
import { expect } from 'chai';
import 'mocha';
import {isAtStart, isAtEnd, moveToNextElement, moveToPrevElement} from "../src/navigation";
import {loadDataModel, renderDataModels} from "../src/webeditkit";
import {installAutoresize} from "../src/uiutils";
import {clearRendererRegistry} from "../dist/renderer";
import {registerRenderer} from "../src/renderer";

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html_empty = `<html>
\t<body data-gr-c-s-loaded="true">
\t\t<div id="root-x" class="editor"></div>
\\t</body>
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
    "concept": "com.strumenta.financialcalc.FinancialCalcSheetFoo",
    "abstractConcept": false
};

describe('WebEditKit', () => {

    it('should support renderDataModels', () => {
        const dom = new JSDOM(html_empty);
        const doc = dom.window.document;
        // @ts-ignore
        global.$ = require('jquery')(dom.window);
        // @ts-ignore
        global.window = dom.window;
        // @ts-ignore
        global.document = doc;

        clearDatamodelRoots();
        clearRendererRegistry();

        installAutoresize();
        renderDataModels();
        expect(doc.querySelector('div.editor').outerHTML).to.eql('<div id="root-x" class="editor"></div>');
        setDatamodelRoot('root-x', dataToNode(rootData1));
        renderDataModels();
        expect(doc.querySelector('div.editor').outerHTML).to.eql('<div id="root-x" class="editor"><input class="fixed default-cell-concrete represent-node" data-node_represented="324292001770075100" style="width: 10px;"></div>');

        clearDatamodelRoots();
        clearRendererRegistry();

        // @ts-ignore
        delete global.$;
        // @ts-ignore
        delete global.window;
        // @ts-ignore
        delete global.document;
    });

    it('should support loadDataModel - server error', () => {
        const dom = new JSDOM(html_empty);
        const doc = dom.window.document;
        // @ts-ignore
        global.$ = require('jquery')(dom.window);
        // @ts-ignore
        global.window = dom.window;
        // @ts-ignore
        global.document = doc;

        expect(()=>{loadDataModel('127.0.0.1:7892','my.qualified.Model', '123','x');}).to.throw('Failed to load data model, using URL 127.0.0.1:7892/models/my.qualified.Model/123');

        // @ts-ignore
        delete global.$;
        // @ts-ignore
        delete global.window;
        // @ts-ignore
        delete global.document;
    });

});