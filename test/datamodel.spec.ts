import {registerDataModelClass, dataToNode, ModelNode, NodeData} from '../src/datamodel';
import { expect } from 'chai';
import 'mocha';

class MyDummyModelNode extends ModelNode {
    constructor(data: NodeData) {
        super(data);
    }
}

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
        }
        expect(dataToNode(data)).to.be.an.instanceof(ModelNode);
        registerDataModelClass('my.awesome.other.concept', MyDummyModelNode);
        expect(dataToNode(data)).to.be.an.instanceof(MyDummyModelNode);
    });

});