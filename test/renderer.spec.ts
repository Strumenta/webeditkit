import { dataToNode } from '../src/datamodel/misc';
import { expect } from 'chai';
import 'mocha';
import { clearRendererRegistry, getRegisteredRenderer, registerRenderer, renderModelNode } from '../src/renderer';
import { VNode } from 'snabbdom/vnode';
import { h } from 'snabbdom';
import { compareVNodes } from './testutils';
import { ModelNode } from '../src/datamodel/modelNode';

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
  concept: 'com.strumenta.financialcalc.FinancialCalcSheet',
  abstractConcept: false,
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

    expect(getRegisteredRenderer('concept.with.renderer')(n)).to.eql(h('span.bar'));
    expect(getRegisteredRenderer('concept.with.renderer')(n)).not.eql(h('span.foo'));
    expect(getRegisteredRenderer('concept.with.renderer')(n)).not.eql(h('span.zum'));
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
