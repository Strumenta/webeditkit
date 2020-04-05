import {VNode} from "snabbdom/vnode";
import {expect} from "chai";
import {installAutoresize} from "../src/uiutils";

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

export function compareVNodes(rendered: VNode, expectedRendered: VNode) : void {
    expect(rendered.sel).to.eql(expectedRendered.sel);
    expect(rendered.data.props).to.eql(expectedRendered.data.props);
    expect(rendered.data.dataset).to.eql(expectedRendered.data.dataset);
    expect(rendered.children).deep.equal(expectedRendered.children);
    expect(rendered.key).to.eql(expectedRendered.key);
    expect(rendered.text).to.eql(expectedRendered.text);
}

export function clone(original) {
    return JSON.parse(JSON.stringify(original));
}

export function pressArrowLeft(element) {
    // @ts-ignore
    const w = global.window;

    // https://css-tricks.com/snippets/javascript/javascript-keycodes/
    // @ts-ignore
    element.dispatchEvent(new w.KeyboardEvent("keydown", {code: 'ArrowLeft',
        key: 'ArrowLeft',
        charKode: 37,
        keyCode: 37,})); // x
    // @ts-ignore
    element.dispatchEvent(new w.KeyboardEvent("keyup", {code: 'ArrowLeft',
        key: 'ArrowLeft',
        charKode: 37,
        keyCode: 37,})); // x
}

export function pressArrowRight(element) {
    // @ts-ignore
    const w = global.window;
    // https://css-tricks.com/snippets/javascript/javascript-keycodes/
    // @ts-ignore
    element.dispatchEvent(new w.KeyboardEvent("keydown", {
        code: 'ArrowRight',
        key: 'ArrowRight',
        charKode: 39,
        keyCode: 39,
    })); // x
    // @ts-ignore
    element.dispatchEvent(new w.KeyboardEvent("keyup", {
        code: 'ArrowRight',
        key: 'ArrowRight',
        charKode: 39,
        keyCode: 39,
    })); // x
}

export function prepareFakeDom(htmlCode) {
    const dom = new JSDOM(htmlCode);
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
    return doc;
}