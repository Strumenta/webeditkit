import { LimitedModelNode } from '../datamodel/modelNode';
import { limitedDataToNode } from '../datamodel/registry';
import { LimitedNodeData } from '../datamodel/misc';

const compareByName = (a: LimitedNodeData, b: LimitedNodeData) => {
  return a.name.localeCompare(b.name);
};

class HttpCommunication {
  private readonly httpMpsServerAddress: string;

  constructor(httpMpsServerAddress: string) {
    this.httpMpsServerAddress = httpMpsServerAddress;
  }

  getInstancesOfConcept(modelName: string, conceptName: string, receiver: (nodes: LimitedModelNode[]) => void) {
    fetch(`${this.httpMpsServerAddress}/models/${modelName}/concept/${conceptName}`).then(async (response) => {
      const data = await response.json();
      if (data.success) {
        const instances = data.value;
        instances.sort(compareByName);
        receiver(instances.map((d: LimitedNodeData) => limitedDataToNode(d)));
      } else {
        console.error(data.message);
      }
    });
  }
}
