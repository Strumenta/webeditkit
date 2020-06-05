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
  // This is not correct because we are overriding the issues for the whole model with the issues for a certain root
  const newIm = new IssuesMap(issues);
  if (deepEqual(newIm, issuesMap[node.model])) {
    log('registerIssuesForNode, false');
    return false;
  }
  log('registerIssuesForNode, true', issuesMap[node.model], newIm);
  issuesMap[node.model] = newIm;
  editorController().notifyErrorsForNode(node, issues);
  return true;
}

export function getIssuesForModel(model: string): IssuesMap {
  return issuesMap[model] || new IssuesMap([]);
}

export function getIssuesForNode(node: NodeInModel): IssueDescription[] {
  return getIssuesForModel(node.model).getIssuesForNode(node.id.regularId);
}