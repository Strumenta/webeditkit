import {registerDataModelClass, dataToNode, ModelNode, NodeData, Ref} from '../src/datamodel';
import { expect } from 'chai';
import 'mocha';
import {isAtStart, moveToNextElement, moveToPrevElement} from "../src/navigation";
import {isAtEnd} from "../dist/navigation";

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

describe('Navigation', () => {

    it('should support moveToNextElement - not at end', () => {
        const dom = new JSDOM(html1);
        const doc = dom.window.document;
        // @ts-ignore
        global.$ = require('jquery')(dom.window);

        const editableName_a = doc.querySelector('div[data-node_represented="1848360241685547698"] .editable');
        const keyword_a = doc.querySelector('div[data-node_represented="1848360241685547698"] .keyword');
        const type_a = doc.querySelector('div[data-node_represented="1848360241685547698"] .fixed.type');

        editableName_a.focus();
        expect(doc.activeElement).to.equals(editableName_a);
        expect(moveToNextElement(editableName_a)).to.equals(true);
        expect(doc.activeElement).to.equals(keyword_a);
        expect(moveToNextElement(keyword_a)).to.equals(true);
        expect(doc.activeElement).to.equals(type_a);

        const editableName_b= doc.querySelector('div[data-node_represented="1848360241685575196"] .editable');
        const keyword_b = doc.querySelector('div[data-node_represented="1848360241685575196"] .keyword');
        const type_b = doc.querySelector('div[data-node_represented="1848360241685575196"] .fixed.type');

        expect(moveToNextElement(type_a)).to.equals(true);
        expect(doc.activeElement).to.equals(editableName_b);
        expect(moveToNextElement(editableName_b)).to.equals(true);
        expect(doc.activeElement).to.equals(keyword_b);
        expect(moveToNextElement(keyword_b)).to.equals(true);
        expect(doc.activeElement).to.equals(type_b);
    });

    it('should support moveToNextElement - through divs with no inputs', () => {
        const dom = new JSDOM(html1);
        const doc = dom.window.document;
        // @ts-ignore
        global.$ = require('jquery')(dom.window);

        const calculationsLabel = doc.querySelector('div[data-node_represented="324292001770075100"] .fixed');
        const editableName_a = doc.querySelector('div[data-node_represented="1848360241685547698"] .editable');

        calculationsLabel.focus();
        expect(doc.activeElement).to.equals(calculationsLabel);

        expect(moveToNextElement(doc.activeElement)).to.equals(true);
        expect(moveToNextElement(doc.activeElement)).to.equals(true);
        expect(moveToNextElement(doc.activeElement)).to.equals(true);

        expect(doc.activeElement).to.equals(editableName_a);
    });

    it('should support moveToNextElement - at end', () => {
        const dom = new JSDOM(html1);
        const doc = dom.window.document;
        // @ts-ignore
        global.$ = require('jquery')(dom.window);

        const type_c = doc.querySelector('div[data-node_represented="1848360241685547705"] .fixed.type');

        type_c.focus();
        expect(doc.activeElement).to.equals(type_c);
        expect(moveToNextElement(type_c)).to.equals(false);
        expect(doc.activeElement).to.equals(type_c);
    });

    it('should support moveToPrevElement - not at end', () => {
        const dom = new JSDOM(html1);
        const doc = dom.window.document;
        // @ts-ignore
        global.$ = require('jquery')(dom.window);

        const editableName_a = doc.querySelector('div[data-node_represented="1848360241685547698"] .editable');
        const keyword_a = doc.querySelector('div[data-node_represented="1848360241685547698"] .keyword');
        const type_a = doc.querySelector('div[data-node_represented="1848360241685547698"] .fixed.type');

        const editableName_b = doc.querySelector('div[data-node_represented="1848360241685575196"] .editable');
        const keyword_b = doc.querySelector('div[data-node_represented="1848360241685575196"] .keyword');
        const type_b = doc.querySelector('div[data-node_represented="1848360241685575196"] .fixed.type');

        type_b.focus();
        expect(doc.activeElement).to.equals(type_b);
        expect(moveToPrevElement(type_b)).to.equals(true);
        expect(doc.activeElement).to.equals(keyword_b);
        expect(moveToPrevElement(keyword_b)).to.equals(true);
        expect(doc.activeElement).to.equals(editableName_b);

        expect(moveToPrevElement(editableName_b)).to.equals(true);
        expect(doc.activeElement).to.equals(type_a);
        expect(moveToPrevElement(type_a)).to.equals(true);
        expect(doc.activeElement).to.equals(keyword_a);
        expect(moveToPrevElement(keyword_a)).to.equals(true);
        expect(doc.activeElement).to.equals(editableName_a);
    });

    it('should support moveToPrevElement - at end', () => {
        const dom = new JSDOM(html1);
        const doc = dom.window.document;
        // @ts-ignore
        global.$ = require('jquery')(dom.window);

        const calculationsLabel = doc.querySelector('div[data-node_represented="324292001770075100"] .fixed');

        calculationsLabel.focus();
        expect(doc.activeElement).to.equals(calculationsLabel);
        expect(moveToPrevElement(calculationsLabel)).to.equals(false);
        expect(doc.activeElement).to.equals(calculationsLabel);
    });

    it('should support moveToPrevElement - through divs with no inputs', () => {
        const dom = new JSDOM(html1);
        const doc = dom.window.document;
        // @ts-ignore
        global.$ = require('jquery')(dom.window);

        const calculationsLabel = doc.querySelector('div[data-node_represented="324292001770075100"] .fixed');
        const editableName_a = doc.querySelector('div[data-node_represented="1848360241685547698"] .editable');

        editableName_a.focus();
        expect(doc.activeElement).to.equals(editableName_a);

        expect(moveToPrevElement(doc.activeElement)).to.equals(true);
        expect(moveToPrevElement(doc.activeElement)).to.equals(true);
        expect(moveToPrevElement(doc.activeElement)).to.equals(true);

        expect(doc.activeElement).to.equals(calculationsLabel);
    });

    it('should support isAtStart - positive case', () => {
        const dom = new JSDOM(html1);
        const doc = dom.window.document;
        // @ts-ignore
        global.$ = require('jquery')(dom.window);

        const editableName_b = doc.querySelector('div[data-node_represented="1848360241685575196"] .editable');
        expect(editableName_b.value).to.equals('sdsd');

        editableName_b.focus();
        editableName_b.setSelectionRange(0, 0);
        expect(isAtStart(editableName_b)).to.equals(true);
    });

    it('should support isAtStart - negative case', () => {
        const dom = new JSDOM(html1);
        const doc = dom.window.document;
        // @ts-ignore
        global.$ = require('jquery')(dom.window);

        const editableName_b = doc.querySelector('div[data-node_represented="1848360241685575196"] .editable');
        expect(editableName_b.value).to.equals('sdsd');

        editableName_b.focus();
        editableName_b.setSelectionRange(1, 1);
        expect(isAtStart(editableName_b)).to.equals(false);
        editableName_b.setSelectionRange(2, 2);
        expect(isAtStart(editableName_b)).to.equals(false);
        editableName_b.setSelectionRange(3, 3);
        expect(isAtStart(editableName_b)).to.equals(false);
        editableName_b.setSelectionRange(4, 4);
        expect(isAtStart(editableName_b)).to.equals(false);
    });

    it('should support isAtEnd - positive case', () => {
        const dom = new JSDOM(html1);
        const doc = dom.window.document;
        // @ts-ignore
        global.$ = require('jquery')(dom.window);

        const editableName_b = doc.querySelector('div[data-node_represented="1848360241685575196"] .editable');
        expect(editableName_b.value).to.equals('sdsd');

        editableName_b.focus();
        editableName_b.setSelectionRange(0, 0);
        expect(isAtEnd(editableName_b)).to.equals(false);
        editableName_b.setSelectionRange(1, 1);
        expect(isAtEnd(editableName_b)).to.equals(false);
        editableName_b.setSelectionRange(2, 2);
        expect(isAtEnd(editableName_b)).to.equals(false);
        editableName_b.setSelectionRange(3, 3);
        expect(isAtEnd(editableName_b)).to.equals(false);
    });

    it('should support isAtEnd - negative case', () => {
        const dom = new JSDOM(html1);
        const doc = dom.window.document;
        // @ts-ignore
        global.$ = require('jquery')(dom.window);

        const editableName_b = doc.querySelector('div[data-node_represented="1848360241685575196"] .editable');
        expect(editableName_b.value).to.equals('sdsd');

        editableName_b.focus();
        editableName_b.setSelectionRange(4, 4);
        expect(isAtEnd(editableName_b)).to.equals(true);
    });

});