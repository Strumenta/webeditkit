import deepEqual from 'deep-equal';
import { IssuesMap } from '../internal';
import { IssueDescription } from '../internal';
import { log } from '../internal';
import { NodeInModel } from '../internal';
import { editorController } from '../internal';

const issuesMap: { [key: string]: IssuesMap } = {};

export function clearIssueMap(): void {
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
  let changed = false;
  const filteredIssues: IssueDescription[] = [];
  for (const i of issues) {
    if (!deepEqual(i.node, node.id)) {
      // this refer to a descendant or an attribute node
      changed = changed || registerIssuesForNode({ model: node.model, id: i.node }, [i]);
    } else {
      filteredIssues.push(i);
    }
  }

  const newIm = new IssuesMap(filteredIssues);
  if (deepEqual(newIm, getIssuesForNode(node))) {
    log('registerIssuesForNode, false');
    return changed;
  }
  log('registerIssuesForNode, true', issuesMap[node.model], newIm);
  getIssuesForModel(node.model).setIssuesForNode(node.id.regularId, filteredIssues);
  editorController().notifyErrorsForNode(node, filteredIssues);
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
