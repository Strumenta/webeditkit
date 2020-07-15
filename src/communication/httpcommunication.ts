import { LimitedModelNode } from '../datamodel/modelNode';
import { limitedDataToNode } from '../datamodel/registry';
import { LimitedNodeData } from '../datamodel/misc';
import { UUID } from './messages';

const compareByName = (a: LimitedNodeData, b: LimitedNodeData) => {
  return a.name.localeCompare(b.name);
};

export interface ModuleInfo {
  name: string;
  uuid: UUID;
  foreignName: string;
  packaged: boolean;
  readonly: boolean;
}

export interface SolutionInfo extends ModuleInfo {
  usedLanguages: string[];
}

export interface ModuleInfoDetailed extends ModuleInfo {
  models: ModelInfo[];
}

export interface ModelInfo {
  qualifiedName: string;
  uuid: UUID;
  foreignName: string;
  readonly: boolean;
  intValue: number;
}

export class HttpCommunication {
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

  getSolutions(languages: string[] = [], receiver: (solutions: SolutionInfo[]) => void){
    let url = `${this.httpMpsServerAddress}/solutions`;
    if (languages.length > 0) {
      url += `?languages=${languages.join(",")}`;
    }
    fetch(url).then(async (response) => {
      const data = await response.json();
      if (data.success) {
        receiver(data.value);
      } else {
        console.error(data.message);
      }
    });
  }

  getModule(moduleName: string, includeModelsWithoutUUID: boolean = false, receiver: (module: ModuleInfoDetailed) => void) {
    const flagValue = Boolean(includeModelsWithoutUUID).toString();
    const url = `${this.httpMpsServerAddress}/modules/${moduleName}?includeModelsWithoutUUID=${flagValue}`;
    fetch(url).then(async (response) => {
      const data = await response.json();
      if (data.success) {
        receiver(data.value);
      } else {
        console.error(data.message);
      }
    });
  }
}
