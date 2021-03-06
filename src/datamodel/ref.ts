import { SyncRequestClient } from 'ts-sync-request';

import { ModelNode, NodeReference } from '../internal';
import { baseUrlForModelName } from '../internal';
import { dataToNode, getDefaultBaseUrl } from '../internal';
import { NodeData, ReferenceData } from '../internal';
import { OperationResult } from '../internal';
import base = Mocha.reporters.base;
import { getWsGlobalCommunication } from '../internal';
import { getDefaultWsUrl } from '../internal';

export class Ref {
  constructor(public data: ReferenceData) {}

  private loadDatUsingHttp(cb: (modelNode: ModelNode) => void): void {
    let baseUrl = baseUrlForModelName(this.data.model.qualifiedName) || getDefaultBaseUrl();
    if (baseUrl == null) {
      throw new Error(
        'No base url specified for model ' + this.data.model.qualifiedName + ' and no default base url available',
      );
    }
    if (!baseUrl.startsWith('http://')) {
      baseUrl = 'http://' + baseUrl;
    }
    const url = baseUrl + '/models/' + this.data.model.qualifiedName + '/' + this.data.id.regularId;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data == null) {
          throw new Error('Data not received correctly on request to ' + url);
        }
        cb(dataToNode(data.value as NodeData));
      });
  }

  private loadDatUsingWs(wsUrl: string, cb: (modelNode: ModelNode) => void): void {
    const globalWs = getWsGlobalCommunication(wsUrl);
    if (globalWs == null) {
      throw new Error(
        'No global ws created'
      );
    }
    const ref : NodeReference = { model: this.data.model.qualifiedName, id: {regularId: this.data.id.regularId}};
    console.log("loading ref using WS");
    globalWs.getNodeData(ref).then((data)=>cb(dataToNode(data)));
  }

  loadData(cb: (modelNode: ModelNode) => void): void {
    const wsUrl = getDefaultWsUrl();
    if (wsUrl == null) {
      this.loadDatUsingHttp(cb);
    } else {
      this.loadDatUsingWs(wsUrl, cb);
    }
  }

  syncLoadData(): ModelNode {
    let baseUrl = baseUrlForModelName(this.data.model.qualifiedName) || getDefaultBaseUrl();
    if (baseUrl == null) {
      throw new Error(
        'No base url specified for model ' + this.data.model.qualifiedName + ' and no default base url available',
      );
    }
    if (!baseUrl.startsWith('http://')) {
      baseUrl = 'http://' + baseUrl;
    }
    const url = baseUrl + '/models/' + this.data.model.qualifiedName + '/' + this.data.id.regularId;
    const response = new SyncRequestClient().get<OperationResult<NodeData>>(url);
    if (!response.success) {
      throw new Error('No data obtained');
    }
    const node = dataToNode(response.value);
    node.injectModelName(this.data.model.qualifiedName, undefined);
    return node;
  }
}
