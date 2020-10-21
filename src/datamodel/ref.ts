import { SyncRequestClient } from 'ts-sync-request';

import { ModelNode } from '../internal';
import { baseUrlForModelName } from '../internal';
import { dataToNode, getDefaultBaseUrl } from '../internal';
import { NodeData, ReferenceData, NodeReference } from '../internal';
import { OperationResult } from '../internal';
import { getWsCommunication } from '../internal';

export class Ref {
  constructor(public data: ReferenceData) {}

  loadData(cb: (modelNode: ModelNode) => void): void {
    console.log("LOAD REF USING WS");
    const ws = getWsCommunication(this.data.model.qualifiedName);
    const ref : NodeReference = { model: this.data.model.qualifiedName, id: {
      regularId: this.data.id.regularId
    }};
    ws.getNodeData(ref).then((data)=> {
      if (data == null) {
        throw new Error('Data not received correctly on request for reference ' + this.data);
      }
      cb(dataToNode(data));
    });
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
    return dataToNode(response.value);
  }
}
