import { clearDatamodelRoots, dataToNode, getDatamodelRoot, setDatamodelRoot } from '../src/datamodel/misc';
import { expect } from 'chai';
import 'mocha';
import { loadDataModel, renderDataModels } from '../src/webeditkit';
import { installAutoresize } from '../src/uiutils';
import { clearRendererRegistry } from '../src/renderer';

var sinon = require('sinon');

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html_empty = `<html>
\t<body data-gr-c-s-loaded="true">
\t\t<div id="root-x" class="editor"></div>
\\t</body>
</html>`;

const rootData1 = {
  children: [
    {
      containingLink: 'inputs',
      children: [
        {
          containingLink: 'type',
          children: [],
          properties: {},
          refs: {},
          id: {
            regularId: '1848360241685547702',
          },
          concept: 'com.strumenta.financialcalc.BooleanType',
          abstractConcept: false,
        },
      ],
      properties: {
        name: 'a',
      },
      refs: {},
      id: {
        regularId: '1848360241685547698',
      },
      name: 'a',
      concept: 'com.strumenta.financialcalc.Input',
      abstractConcept: false,
    },
    {
      containingLink: 'inputs',
      children: [
        {
          containingLink: 'type',
          children: [],
          properties: {},
          refs: {},
          id: {
            regularId: '1848360241685547711',
          },
          concept: 'com.strumenta.financialcalc.StringType',
          abstractConcept: false,
        },
      ],
      properties: {
        name: 'b',
      },
      refs: {},
      id: {
        regularId: '1848360241685547705',
      },
      name: 'b',
      concept: 'com.strumenta.financialcalc.Input',
      abstractConcept: false,
    },
  ],
  properties: {
    name: 'My calculations',
  },
  refs: {},
  id: {
    regularId: '324292001770075100',
  },
  name: 'My calculations',
  concept: 'com.strumenta.financialcalc.FinancialCalcSheetFoo',
  abstractConcept: false,
};

describe('WebEditKit', () => {
  let doc = null;

  beforeEach(function () {
    const dom = new JSDOM(html_empty);
    doc = dom.window.document;
    // @ts-ignore
    global.$ = require('jquery')(dom.window);
    // @ts-ignore
    global.jQuery = global.$;
    // @ts-ignore
    global.window = dom.window;
    // @ts-ignore
    global.document = doc;

    clearDatamodelRoots();
    clearRendererRegistry();
  });

  afterEach(function () {
    sinon.restore();

    clearDatamodelRoots();
    clearRendererRegistry();

    // @ts-ignore
    delete global.$;
    // @ts-ignore
    delete global.jQuery;
    // @ts-ignore
    delete global.window;
    // @ts-ignore
    delete global.document;
  });

  it('should support renderDataModels', () => {
    installAutoresize();
    renderDataModels();
    expect(doc.querySelector('div.editor').outerHTML).to.eql('<div id="root-x" class="editor"></div>');
    setDatamodelRoot('root-x', dataToNode(rootData1));
    renderDataModels();
    expect(doc.querySelector('div.editor').outerHTML).to.eql(
      '<div id="root-x" class="editor"><input class="fixed default-cell-concrete represent-node" data-node_represented="324292001770075100" style="width: 10px;"></div>',
    );
  });

  it('should support loadDataModel', (done) => {
    installAutoresize();

    let successCb = undefined;
    let failCb = undefined;
    sinon.replace(jQuery, 'ajax', function (params) {
      expect(params.url).to.equals('http://localhost:2904/models/my.qualified.model/123456');
      expect(params.type).to.equals('get');
      successCb = params.success;
      return {
        fail: function (_failCb) {
          failCb = _failCb;
        },
      };
    });
    loadDataModel('http://localhost:2904', 'my.qualified.model', '123456', 'root-x');
    expect(getDatamodelRoot('root-x')).to.eql(undefined);
    successCb(rootData1);
    const rootX = getDatamodelRoot('root-x');
    expect(rootX.name()).to.eql('My calculations');
    expect(rootX.conceptName()).to.eql('com.strumenta.financialcalc.FinancialCalcSheetFoo');
    expect(rootX.rootName()).to.eql('root-x');
    expect(rootX.modelName()).to.eql('my.qualified.model');
    done();
  });
});
