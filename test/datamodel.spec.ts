import {registerDataModelClass, dataToNode, ModelNode} from '../src/datamodel';
import { expect } from 'chai';
import 'mocha';

describe('Data Model Class Registry', () => {

    it('should create a ModelNode if not specific class is registered for the concept', () => {
        const modelnode = dataToNode({
            concept: 'my.awesome.concept',
            abstractConcept: false,
            children: [],
            containingLink: null,
            id: {},
            modelName: 'foo',
            parent: null,
            properties: {},
            refs: [],
            rootName: 'bar'
        });
        expect(modelnode).to.be.an.instanceof(ModelNode);
    });

});