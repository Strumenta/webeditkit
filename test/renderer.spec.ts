import { expect } from 'chai';
import 'mocha';
import { clearRendererRegistry, getRegisteredRenderer, registerRenderer, renderModelNode } from '../src/internal';
import { VNode } from 'snabbdom/vnode';
import { h } from 'snabbdom';
import { compareVNodes } from './testutils';
import { ModelNode } from '../src/internal';
import { dataToNode } from '../src/internal';
import { NodeData } from '../src/internal';

const rootData1: NodeData = {
  name: 'My calculations',
  children: [
    {
      name: 'a',
      containingLink: 'inputs',
      children: [
        {
          name: '-',
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
      name: 'b',
      containingLink: 'inputs',
      children: [
        {
          name: '-',
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
  concept: 'com.strumenta.financialcalc.FinancialCalcSheet',
  abstractConcept: false,
  modelName: '',
};

describe('Renderer', () => {
  it('should support renderer registry - negative case', () => {
    expect(getRegisteredRenderer('concept.without.renderer')).to.equals(undefined);
  });

  it('should support renderer registry - positive case', () => {
    const myDummyRenderer1 = (modelNode: ModelNode): VNode => {
      return h('span.foo');
    };
    const myDummyRenderer2 = (modelNode: ModelNode): VNode => {
      return h('span.bar');
    };
    const myDummyRenderer3 = (modelNode: ModelNode): VNode => {
      return h('span.zum');
    };

    registerRenderer('concept.with.renderer', myDummyRenderer2);

    const n = dataToNode(rootData1);

    const renderer = getRegisteredRenderer('concept.with.renderer');
    // tslint:disable-next-line:no-unused-expression
    expect(renderer).to.not.be.undefined;
    expect(renderer!(n)).to.eql(h('span.bar'));
    expect(renderer!(n)).not.eql(h('span.foo'));
    expect(renderer!(n)).not.eql(h('span.zum'));
  });

  it('should support clearRendererRegistry', () => {
    const myDummyRenderer2 = (modelNode: ModelNode): VNode => {
      return h('span.zum');
    };
    registerRenderer('concept.with.renderer', myDummyRenderer2);
    expect(getRegisteredRenderer('concept.with.renderer')).not.equals(undefined);
    clearRendererRegistry();
    expect(getRegisteredRenderer('concept.with.renderer')).to.equals(undefined);
  });

  it('should support getRenderer - using default renderer', () => {
    const n = dataToNode(rootData1);

    clearRendererRegistry();
    const rendered = renderModelNode(n);
    const expectedRendered = h(
      'input.fixed.default-cell-concrete.represent-node',
      {
        key: '324292001770075100',
        dataset: {
          node_represented: '324292001770075100',
        },
        props: {
          value: '[default FinancialCalcSheet]',
        },
      },
      [],
    );
    compareVNodes(rendered, expectedRendered);
  });

  it('should support getRenderer - using registered renderer', () => {
    const r = (modelNode: ModelNode): VNode => {
      return h('span.bar', {}, [modelNode.name()]);
    };

    registerRenderer('com.strumenta.financialcalc.FinancialCalcSheet', r);

    const n = dataToNode(rootData1);
    const rendered = renderModelNode(n);
    const expectedRendered = h(
      'span.bar.represent-node',
      {
        key: '324292001770075100',
        dataset: {
          node_represented: '324292001770075100',
        },
      },
      ['My calculations'],
    );
    compareVNodes(rendered, expectedRendered);
  });
});
