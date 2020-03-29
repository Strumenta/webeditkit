import {registerDataModelClass, dataToNode, ModelNode, NodeData, Ref} from '../src/datamodel';
import { expect } from 'chai';
import 'mocha';

class MyDummyModelNode extends ModelNode {
    constructor(data: NodeData) {
        super(data);
    }
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

describe('Data Model Class Registry', () => {

    it('should create a ModelNode if not specific class is registered for the concept', () => {
        const modelnode = dataToNode({
            concept: 'my.awesome.concept',
            abstractConcept: false,
            children: [],
            containingLink: null,
            id: {regularId: "123"},
            modelName: 'foo',
            parent: null,
            properties: {},
            refs: {},
            rootName: 'bar'
        });
        expect(modelnode).to.be.an.instanceof(ModelNode);
    });

    it('should create a ModelNode if a specific class is registered for the concept', () => {
        const data = {
            concept: 'my.awesome.other.concept',
            abstractConcept: false,
            children: [],
            containingLink: null,
            id: {regularId: "123"},
            modelName: 'foo',
            parent: null,
            properties: {},
            refs: {},
            rootName: 'bar'
        };
        expect(dataToNode(data)).to.be.an.instanceof(ModelNode);
        registerDataModelClass('my.awesome.other.concept', MyDummyModelNode);
        expect(dataToNode(data)).to.be.an.instanceof(MyDummyModelNode);
    });

});

describe('References', () => {

    it('should not accept null', () => {
        expect(()=> { new Ref(null); }).to.throw('Ref cannot be built with null data');
    });

});

describe('ModelNode', () => {

    it('should support childrenByLinkName', () => {
        const root = dataToNode(rootData1);
        const inputs = root.childrenByLinkName('inputs');
        expect(inputs.length).to.equals(2);
        expect(inputs[0].name()).to.equals("a");
        expect(inputs[1].name()).to.equals("b");
    });

    it('should support property - existing', () => {
        const root = dataToNode(rootData1);
        const inputs = root.childrenByLinkName('inputs');
        const input_a = inputs[0];
        expect(input_a.property('name')).to.equals('a');
    });

    it('should support property - unexisting', () => {
        const root = dataToNode(rootData1);
        expect(()=> {root.property("unexisting")}).to.throw('Property unexisting not found');
    });

    it('should support name - existing', () => {
        const root = dataToNode(rootData1);
        expect(root.name()).to.equals('My calculations');
    });

    it('should support name - unexisting', () => {
        const root = dataToNode(rootData1);
        const input_a = root.childrenByLinkName('inputs')[0];
        const type_of_a = input_a.childByLinkName('type');
        expect(()=> {type_of_a.name()}).to.throw('Property name not found');
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
        expect(root.findNodeById('unexisting')).to.equals(null);
    });

    it('should support findNodeById - existing', () => {
        const root = dataToNode(rootData1);
        const n = root.findNodeById('1848360241685547705')
        expect(n.name()).to.equals('b');
    });

});