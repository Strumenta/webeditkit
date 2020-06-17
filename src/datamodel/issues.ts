import { IssueDescription } from '../communication/messages';

export class IssuesMap {
  private map: { [key: string]: IssueDescription[] } = {};

  constructor(issues: IssueDescription[]) {
    for (const i of issues) {
      if (this.map[i.node.regularId] == null) {
        this.map[i.node.regularId] = [];
      }
      this.map[i.node.regularId].push(i);
    }
  }

  getIssuesForNode(nodeId: string): IssueDescription[] {
    return this.map[nodeId] || [];
  }

  setIssuesForNode(nodeId: string, issues: IssueDescription[]) : void {
    this.map[nodeId] = issues;
  }
}
