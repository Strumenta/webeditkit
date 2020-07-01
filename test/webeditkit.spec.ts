import { expect } from 'chai';
import 'mocha';
import { renderDataModels } from '../src/index';
import { clearRendererRegistry } from '../src/presentation/renderer';
import { clearDatamodelRoots, dataToNode, getDatamodelRoot, setDatamodelRoot } from '../src/datamodel/registry';
import { prepareFakeDom } from './testutils';
import { clearIssueMap } from '../src/communication/issues';
import { NodeData } from '../src/datamodel/misc';

import * as sinon from 'sinon';

const html_empty = `<html>
\t<body data-gr-c-s-loaded="true">
\t\t<div id="root-x" class="editor"></div>
\\t</body>
</html>`;

const rootData1: NodeData = {
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
          modelName: '',
        },
      ],
      properties: {
        name: 'a',
      },
      refs: {},
      id: {
        regularId: '1848360241685547698',
      },
      concept: 'com.strumenta.financialcalc.Input',
      abstractConcept: false,
      modelName: '',
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
          modelName: '',
        },
      ],
      properties: {
        name: 'b',
      },
      refs: {},
      id: {
        regularId: '1848360241685547705',
      },
      concept: 'com.strumenta.financialcalc.Input',
      abstractConcept: false,
      modelName: '',
    },
  ],
  properties: {
    name: 'My calculations',
  },
  refs: {},
  id: {
    regularId: '324292001770075100',
  },
  concept: 'com.strumenta.financialcalc.FinancialCalcSheetFoo',
  abstractConcept: false,
  modelName: '',
};

describe('WebEditKit', () => {
  let doc: Document | undefined = undefined;

  beforeEach(function () {
    doc = prepareFakeDom(html_empty);

    clearDatamodelRoots();
    clearRendererRegistry();
    clearIssueMap();
  });

  afterEach(function () {
    sinon.restore();

    clearDatamodelRoots();
    clearRendererRegistry();
    clearIssueMap();

    // @ts-ignore
    delete global.window;
    // @ts-ignore
    delete global.document;
  });

  it('should support renderDataModels', () => {
    renderDataModels();
    expect(doc!.querySelector('div.editor')!.outerHTML).to.eql('<div id="root-x" class="editor"></div>');
    setDatamodelRoot('root-x', dataToNode(rootData1));
    renderDataModels();
    expect(doc!.querySelector('div.editor')!.outerHTML).to.eql(
      '<div id="root-x" class="editor" data-model_local_name="root-x"><input class="fixed default-cell-concrete represent-node" data-node_represented="324292001770075100" style="width: 10px;"></div>',
    );
  });

  // FIXME it conflicts with some other test
  // it('should support loadDataModel', (done) => {
  //   installAutoresize();
  //
  //   let successCb = undefined;
  //   let failCb = undefined;
  //   // @ts-ignore
  //   sinon.replace(global.$, 'ajax', function (params) {
  //     expect(params.url).to.equals('http://localhost:2904/models/my.qualified.model/123456');
  //     expect(params.type).to.equals('get');
  //     successCb = params.success;
  //     return {
  //       fail: function (_failCb) {
  //         failCb = _failCb;
  //       },
  //     };
  //   });
  //   loadDataModel('http://localhost:2904', 'my.qualified.model', '123456', 'root-x');
  //   expect(getDatamodelRoot('root-x')).to.eql(undefined);
  //   successCb(rootData1);
  //   const rootX = getDatamodelRoot('root-x');
  //   expect(rootX.name()).to.eql('My calculations');
  //   expect(rootX.conceptName()).to.eql('com.strumenta.financialcalc.FinancialCalcSheetFoo');
  //   expect(rootX.rootName()).to.eql('root-x');
  //   expect(rootX.modelName()).to.eql('my.qualified.model');
  //   done();
  // });
});
