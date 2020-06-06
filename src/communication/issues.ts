import { IssuesMap } from '../datamodel/issues';
import { IssueDescription } from './messages';
import { log } from '../utils/misc';
import { NodeInModel } from '../datamodel/misc';
import { editorController } from '../presentation';
import deepEqual = require('deep-equal');

const issuesMap: { [key: string]: IssuesMap } = {};

export function clearIssueMap() {
  for (const member in issuesMap) delete issuesMap[member];
}

export function registerIssuesForModel(model: string, issues: IssueDescription[]): boolean {
  const newIm = new IssuesMap(issues);
  if (deepEqual(newIm, issuesMap[model])) {
    log('registerIssuesForModel, false');
    return false;
  }
  log('registerIssuesForModel, true', issuesMap[model], newIm);
  issuesMap[model] = newIm;
  return true;
}

export function registerIssuesForNode(node: NodeInModel, issues: IssueDescription[]): boolean {
  for (const i of issues) {
    if (!deepEqual(i.node, node.id)) {
      throw new Error(`These issues cannot be attributed to this node: node target is ${JSON.stringify(node)}, node in issue is ${JSON.stringify(i.node)}`);
    }
  }

  const newIm = new IssuesMap(issues);
  if (deepEqual(newIm, getIssuesForNode(node))) {
    log('registerIssuesForNode, false');
    return false;
  }
  log('registerIssuesForNode, true', issuesMap[node.model], newIm);
  getIssuesForModel(node.model).setIssuesForNode(node.id.regularId, issues);
  editorController().notifyErrorsForNode(node, issues);
  return true;
}

export function getIssuesForModel(model: string): IssuesMap {
  const existing = issuesMap[model];
  if (existing != null) {
    return existing;
  }
  const newlyCreated = new IssuesMap([]);
  issuesMap[model] = newlyCreated;
  return newlyCreated;
}

export function getIssuesForNode(node: NodeInModel): IssueDescription[] {
  return getIssuesForModel(node.model).getIssuesForNode(node.id.regularId);
}
