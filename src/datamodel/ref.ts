import { ModelNode } from './modelNode';
import { baseUrlForModelName } from '../index';
import { dataToNode, getDefaultBaseUrl } from './registry';
import { ReferenceData } from './misc';

export class Ref {
  data: ReferenceData;

  constructor(data: ReferenceData) {
    this.data = data;
  }

  loadData(cb: (modelNode: ModelNode) => void) {
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
    $.getJSON(url, (data) => {
      if (data == null) {
        throw new Error('Data not received correctly on request to ' + url);
      }
      cb(dataToNode(data));
    });
  }
}
