import { ModelNode } from './modelNode';
import { baseUrlForModelName } from '../index';
import { dataToNode, getDefaultBaseUrl } from './registry';
import { NodeData, ReferenceData } from './misc';

export class Ref {
  data: ReferenceData;

  constructor(data: ReferenceData) {
    this.data = data;
  }

  loadData(cb: (modelNode: ModelNode) => void): void {
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
}
