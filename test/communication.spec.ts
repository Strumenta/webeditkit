import { expect } from 'chai';
import 'mocha';
import {
  clearIssueMap,
  getIssuesForModel,
  registerIssuesForModel,
  registerIssuesForNode,
} from '../src/communication/issues';
import { getIssuesForNode } from '../src/communication/issues';

describe('Communication.Issues', () => {
  beforeEach(() => {
    clearIssueMap();
  });

  afterEach(() => {
    clearIssueMap();
  });

  it('getIssuesForModel on empty', () => {
    const issues = getIssuesForModel('my.unexisting.model');
    expect(issues.getIssuesForNode('123').length).to.eql(0);
  });

  it('getIssuesForModel on model registered, matching node id', () => {
    registerIssuesForModel('my.model', [
      { message: 'Nothing to bad', severity: 'warning', node: { regularId: '123' } },
    ]);
    const issues = getIssuesForModel('my.model');
    expect(issues.getIssuesForNode('123')).to.eql([
      { message: 'Nothing to bad', severity: 'warning', node: { regularId: '123' } },
    ]);
  });

  it('getIssuesForModel on model registered, not matching node id', () => {
    registerIssuesForModel('my.model', [
      { message: 'Nothing to bad', severity: 'warning', node: { regularId: '123' } },
    ]);
    const issues = getIssuesForModel('my.model');
    expect(issues.getIssuesForNode('456')).to.eql([]);
  });

  it('clearIssueMap', () => {
    registerIssuesForModel('my.model', [
      { message: 'Nothing to bad', severity: 'warning', node: { regularId: '123' } },
    ]);
    let issues = getIssuesForModel('my.model');
    expect(issues.getIssuesForNode('123')).to.eql([
      { message: 'Nothing to bad', severity: 'warning', node: { regularId: '123' } },
    ]);
    clearIssueMap();
    issues = getIssuesForModel('my.model');
    expect(issues.getIssuesForNode('123')).to.eql([]);
  });

  it('registerIssuesForNode on model registered, matching node id', () => {
    registerIssuesForNode({ model: 'my.model', id: { regularId: '123' } }, [
      { message: 'Nothing to bad', severity: 'warning', node: { regularId: '123' } },
    ]);

    const issues = getIssuesForModel('my.model');
    expect(issues.getIssuesForNode('123')).to.eql([
      { message: 'Nothing to bad', severity: 'warning', node: { regularId: '123' } },
    ]);

    expect(getIssuesForNode({ model: 'my.model', id: { regularId: '123' } })).to.eql([
      { message: 'Nothing to bad', severity: 'warning', node: { regularId: '123' } },
    ]);
  });

  it('registerIssuesForNode on model registered, not matching node id', () => {
    registerIssuesForNode({ model: 'my.model', id: { regularId: '123' } }, [
      { message: 'Nothing to bad', severity: 'warning', node: { regularId: '123' } },
    ]);

    const issues = getIssuesForModel('my.model');
    expect(issues.getIssuesForNode('456')).to.eql([]);

    expect(getIssuesForNode({ model: 'my.model', id: { regularId: '456' } })).to.eql([]);
  });

  it('registerIssuesForNode for multiple nodes in same model', () => {
    registerIssuesForNode({ model: 'my.model', id: { regularId: '123' } }, [
      { message: 'Nothing to bad1', severity: 'warning', node: { regularId: '123' } },
    ]);
    registerIssuesForNode({ model: 'my.model', id: { regularId: '124' } }, [
      { message: 'Nothing to bad2', severity: 'warning', node: { regularId: '124' } },
    ]);
    registerIssuesForNode({ model: 'my.model', id: { regularId: '125' } }, [
      { message: 'Nothing to bad3', severity: 'warning', node: { regularId: '125' } },
    ]);

    expect(getIssuesForNode({ model: 'my.model', id: { regularId: '123' } })).to.eql([
      { message: 'Nothing to bad1', severity: 'warning', node: { regularId: '123' } },
    ]);
    expect(getIssuesForNode({ model: 'my.model', id: { regularId: '124' } })).to.eql([
      { message: 'Nothing to bad2', severity: 'warning', node: { regularId: '124' } },
    ]);
    expect(getIssuesForNode({ model: 'my.model', id: { regularId: '125' } })).to.eql([
      { message: 'Nothing to bad3', severity: 'warning', node: { regularId: '125' } },
    ]);
  });

  it('registerIssuesForNode, node of issue should match', () => {
    // register issue with different node id: this is now handled
    registerIssuesForNode({ model: 'my.model', id: { regularId: '123' } }, [
        { message: 'Nothing to bad1', severity: 'warning', node: { regularId: '456' } },
      ]);

    expect(getIssuesForNode({ model: 'my.model', id: { regularId: '123' } })).to.eql([]);
    expect(getIssuesForNode({ model: 'my.model', id: { regularId: '456' } })).to.eql([{ message: 'Nothing to bad1', severity: 'warning', node: { regularId: '456' } }]);
  });
});
