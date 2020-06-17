import { NodeData } from '../src/datamodel/misc';
import { expect } from 'chai';
import 'mocha';
import { ModelNode } from '../src/datamodel/modelNode';
import { Ref } from '../src/datamodel/ref';
import { dataToNode, registerDataModelClass } from '../src/datamodel/registry';

class MyDummyModelNode extends ModelNode {
  constructor(data: NodeData) {
    super(data);
  }
}

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
  concept: 'com.strumenta.financialcalc.FinancialCalcSheet',
  abstractConcept: false,
  modelName: '',
};

function clone<T extends Record<string, unknown>>(original: T): T {
  return JSON.parse(JSON.stringify(original));
}

describe('Data Model Class Registry', () => {
  it('should create a ModelNode if not specific class is registered for the concept', () => {
    const modelnode = dataToNode({
      concept: 'my.awesome.concept',
      abstractConcept: false,
      children: [],
      containingLink: undefined,
      id: { regularId: '123' },
      modelName: 'foo',
      parent: undefined,
      properties: {},
      refs: {},
      rootName: 'bar',
    });
    expect(modelnode).to.be.an.instanceof(ModelNode);
  });

  it('should create a ModelNode if a specific class is registered for the concept', () => {
    const data: NodeData = {
      concept: 'my.awesome.other.concept',
      abstractConcept: false,
      children: [],
      containingLink: undefined,
      id: { regularId: '123' },
      modelName: 'foo',
      parent: undefined,
      properties: {},
      refs: {},
      rootName: 'bar',
    };
    expect(dataToNode(data)).to.be.an.instanceof(ModelNode);
    registerDataModelClass('my.awesome.other.concept', MyDummyModelNode);
    expect(dataToNode(data)).to.be.an.instanceof(MyDummyModelNode);
  });
});

describe('ModelNode', () => {
  it('should support childrenByLinkName', () => {
    const root = dataToNode(rootData1);
    const inputs = root.childrenByLinkName('inputs');
    expect(inputs.length).to.equals(2);
    expect(inputs[0].name()).to.equals('a');
    expect(inputs[1].name()).to.equals('b');
  });

  it('should support property - existing', () => {
    const root = dataToNode(rootData1);
    const inputs = root.childrenByLinkName('inputs');
    const input_a = inputs[0];
    expect(input_a.property('name')).to.equals('a');
  });

  it('should support property - unexisting', () => {
    const root = dataToNode(rootData1);
    expect(root.property('unexisting')).to.be.undefined;
  });

  it('should support name - existing', () => {
    const root = dataToNode(rootData1);
    expect(root.name()).to.equals('My calculations');
  });

  it('should support name - unexisting', () => {
    const root = dataToNode(rootData1);
    const input_a = root.childrenByLinkName('inputs')[0];
    const type_of_a = input_a.childByLinkName('type');
    expect(type_of_a!.name()).to.equals(undefined);
  });

  it('should support idString', () => {
    const root = dataToNode(rootData1);
    expect(root.idString()).to.equals('324292001770075100');
  });

  it('should support conceptName', () => {
    const root = dataToNode(rootData1);
    expect(root.conceptName()).to.equals('com.strumenta.financialcalc.FinancialCalcSheet');
  });

  it('should support simpleConceptName', () => {
    const root = dataToNode(rootData1);
    expect(root.simpleConceptName()).to.equals('FinancialCalcSheet');
  });

  it('should support findNodeById - unexisting', () => {
    const root = dataToNode(rootData1);
    // tslint:disable-next-line:no-unused-expression
    expect(root.findNodeById('unexisting')).to.be.undefined;
  });

  it('should support findNodeById - existing', () => {
    const root = dataToNode(rootData1);
    const n = root.findNodeById('1848360241685547705');
    expect(n?.name()).to.equals('b');
  });

  it('should support findNodeById - existing', () => {
    const root = dataToNode(rootData1);
    const n = root.findNodeById('1848360241685547705');
    expect(n!.name()).to.equals('b');
  });

  it('should support root - positive', () => {
    const root = dataToNode(rootData1);
    expect(root.isRoot()).to.equals(true);
  });

  it('should support root - negative', () => {
    const root = dataToNode(rootData1);
    const n = root.findNodeById('1848360241685547705');
    expect(n!.isRoot()).to.equals(false);
  });

  it('should support containmentName - negative', () => {
    const root = dataToNode(rootData1);
    expect(root.containmentName()).to.equals(null);
  });

  it('should support containmentName - positive', () => {
    const root = dataToNode(rootData1);
    const n = root.findNodeById('1848360241685547705');
    expect(n!.containmentName()).to.equals('inputs');
  });

  it('should support index - root', () => {
    const root = dataToNode(rootData1);
    expect(() => {
      root.index();
    }).to.throw('Cannot get index of root');
  });

  it('should support index - no parent set', () => {
    const root = dataToNode(rootData1);
    const n = root.findNodeById('1848360241685547705');
    expect(() => {
      n!.index();
    }).to.throw('Cannot get index when parent is not set');
  });

  it('should support index - parent set', () => {
    const root = dataToNode(clone(rootData1));
    root.injectModelName('myModel', 'myRoot');
    const n_a = root.findNodeById('1848360241685547698');
    const n_b = root.findNodeById('1848360241685547705');
    expect(n_a!.index()).to.equals(0);
    expect(n_b!.index()).to.equals(1);
  });
});
