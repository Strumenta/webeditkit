import { VNode } from '../src/internal';
import { expect } from 'chai';
import { Message } from '../src/internal';

import { JSDOM } from 'jsdom';

const keysim = require('keysim');

export function compareVNodes(rendered: VNode, expectedRendered: VNode): void {
  expect(rendered.sel).to.eql(expectedRendered.sel);
  expect(rendered.data!.props).to.eql(expectedRendered.data!.props);
  expect(rendered.data!.dataset).to.eql(expectedRendered.data!.dataset);
  expect(rendered.children).deep.equal(expectedRendered.children);
  expect(rendered.key).to.eql(expectedRendered.key);
  expect(rendered.text).to.eql(expectedRendered.text);
}

export function clone<T extends object>(original: T): T {
  return JSON.parse(JSON.stringify(original));
}

export function pressChar(element: Element, letter: string, code: number) {
  // @ts-ignore
  const w = global.window;

  // https://css-tricks.com/snippets/javascript/javascript-keycodes/
  // @ts-ignore
  element.dispatchEvent(
    new w.KeyboardEvent('keydown', { key: letter, code: code.toString(), bubbles: true }),
  ); // x
  // @ts-ignore
  element.dispatchEvent(
    new w.KeyboardEvent('keyup', { key: letter, code: code.toString(), bubbles: true }),
  ); // x
}

export function pressArrowLeft(element: Element) {
  // @ts-ignore
  const w = global.window;

  // https://css-tricks.com/snippets/javascript/javascript-keycodes/
  // @ts-ignore
  element.dispatchEvent(
    new w.KeyboardEvent('keydown', { code: '37', key: 'ArrowLeft' }),
  ); // x
  // @ts-ignore
  element.dispatchEvent(
    new w.KeyboardEvent('keyup', { code: '37', key: 'ArrowLeft' }),
  ); // x
}

export function pressArrowRight(element: Element) {
  // @ts-ignore
  const w = global.window;
  // https://css-tricks.com/snippets/javascript/javascript-keycodes/
  // @ts-ignore
  element.dispatchEvent(
    new w.KeyboardEvent('keydown', {
      code: '39',
      key: 'ArrowRight',
    }),
  ); // x
  // @ts-ignore
  element.dispatchEvent(
    new w.KeyboardEvent('keyup', {
      code: '39',
      key: 'ArrowRight',
    }),
  ); // x
}

export function pressEnter(element: Element) {
  // @ts-ignore
  const w = global.window;
  // https://css-tricks.com/snippets/javascript/javascript-keycodes/
  // @ts-ignore
  element.dispatchEvent(
    new w.KeyboardEvent('keydown', {
      code: '13',
      key: 'Enter',
    }),
  ); // x
  // @ts-ignore
  element.dispatchEvent(
    new w.KeyboardEvent('keyup', {
      code: '13',
      key: 'Enter',
    }),
  ); // x
}

export function pressBackspace(element: Element) {
  // @ts-ignore
  const w = global.window;
  // https://css-tricks.com/snippets/javascript/javascript-keycodes/
  // @ts-ignore
  element.dispatchEvent(
    new w.KeyboardEvent('keydown', {
      code: '8',
      key: 'Backspace',
    }),
  ); // x
  // @ts-ignore
  element.dispatchEvent(
    new w.KeyboardEvent('keyup', {
      code: '8',
      key: 'Backspace',
    }),
  ); // x
}

export function prepareFakeDom(htmlCode: string): Document {
  const dom = new JSDOM(htmlCode);
  const doc = dom.window.document;
  // @ts-ignore
  global.window = dom.window;
  // @ts-ignore
  global.document = doc;
  // @ts-ignore
  global.navigator = { userAgent: 'fake browser' };
  return doc;
}

export function focusedElement() {
  // @ts-ignore
  const doc = global.document;
  return doc.activeElement;
}

export function triggerInputEvent(element: Element) {
  element.dispatchEvent(new window.InputEvent('input', {}));
}

export function assertTheseMessagesAreReceived(
  receivedArray: boolean[],
  received: number,
  data: string,
  messages: { type: string; check: (msg: Message) => void }[],
) {
  if (received <= messages.length) {
    const dataj = JSON.parse(data) as Message;
    messages.forEach((value, index) => {
      if (dataj.type === value.type) {
        value.check(dataj);
        receivedArray[index] = true;
      }
    });
    if (received === messages.length) {
      messages.forEach((value, index) => {
        expect(receivedArray[index]).to.eql(true, `Message ${messages[index].type} not received`);
      });
    }
  }
}
