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

});