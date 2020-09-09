import { SyncRequestClient } from 'ts-sync-request';
import {
  LimitedModelNode,
  ModelNode,
  dataToNode,
  limitedDataToNode,
  LimitedNodeData,
  NodeData,
  UUID,
} from '../internal';

const compareByName = (a: LimitedNodeData, b: LimitedNodeData) => {
  if (a.name === undefined || b.name === undefined) {
    throw Error(`Cannot compare two nodes without name: ${JSON.stringify(a)}, ${JSON.stringify(b)}`);
  }
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

export interface ModelInfoDetailed extends ModelInfo {
  roots: LimitedNodeData[];
}

export interface OperationResult<D> {
  success: boolean;
  message: string;
  value: D;
}

export class HttpCommunication {
  constructor(private readonly httpMpsServerAddress: string) {
  }

  async executeAction(modelName: string, nodeIdString: string, actionName: string): Promise<any> {
    return new Promise<any>((resolve, onrejected) => {
      void fetch(`${this.httpMpsServerAddress}/models/${modelName}/${nodeIdString}/action/${actionName}`, {
        method: 'POST',
      }).then(async (response) => {
        const data = (await response.json()) as OperationResult<any>;
        if (data.success) {
          resolve(data.value);
        } else {
          onrejected(data.message);
        }
      });
    });
  }

  async reload(modelName: string): Promise<void> {
    return new Promise<void>((resolve, onrejected) => {
      void fetch(`${this.httpMpsServerAddress}/models/${modelName}/reload`, { method: 'POST' }).then(
        async (response) => {
          const data = (await response.json()) as OperationResult<any>;
          if (data.success) {
            resolve();
          } else {
            onrejected(data.message);
          }
        },
      );
    });
  }

  async getCurrentBranch(): Promise<string> {
    return new Promise<string>((resolve, onrejected) => {
      void fetch(`${this.httpMpsServerAddress}/git/currentBranch`).then(async (response) => {
        const data = (await response.json()) as OperationResult<string>;
        if (data.success) {
          resolve(data.value);
        } else {
          onrejected(data.message);
        }
      });
    });
  }

  getInstancesOfConcept(modelName: string, conceptName: string, receiver: (nodes: LimitedModelNode[]) => void): void {
    const url = `${this.httpMpsServerAddress}/models/${modelName}/concept/${conceptName}`;
    void fetch(url).then(async (response) => {
      const data = (await response.json()) as OperationResult<LimitedNodeData[]>;
      if (data.success) {
        const instances = data.value;
        try {
          instances.sort(compareByName);
        } catch (e) {
          console.error(`Error occurred while sorting instances obtained from ${url}: ${e}`);
        }
        receiver(instances.map((d: LimitedNodeData) => limitedDataToNode(d)));
      } else {
        console.error(data.message);
      }
    });
  }

  getSolutions(languages: string[] = [], receiver: (solutions: SolutionInfo[]) => void): void {
    let url = `${this.httpMpsServerAddress}/solutions`;
    if (languages.length > 0) {
      url += `?languages=${languages.join(',')}`;
    }
    void fetch(url).then(async (response) => {
      const data = (await response.json()) as OperationResult<SolutionInfo[]>;
      if (data.success) {
        receiver(data.value);
      } else {
        console.error(data.message);
      }
    });
  }

  getModule(
    moduleName: string,
    includeModelsWithoutUUID = false,
    receiver: (module: ModuleInfoDetailed) => void,
  ): void {
    const flagValue = Boolean(includeModelsWithoutUUID).toString();
    const url = `${this.httpMpsServerAddress}/modules/${moduleName}?includeModelsWithoutUUID=${flagValue}`;
    void fetch(url).then(async (response) => {
      const data = (await response.json()) as OperationResult<ModuleInfoDetailed>;
      if (data.success) {
        receiver(data.value);
      } else {
        console.error(data.message);
      }
    });
  }

  getMpsEditor(conceptName: string): ModelNode | null {
    const url = `${this.httpMpsServerAddress}/concepts/${conceptName}/editor`;
    const response = new SyncRequestClient().get<OperationResult<NodeData>>(url);
    if (response.success) {
      if (response.value.concept === 'jetbrains.mps.lang.editor.ConceptEditorDeclaration') {
        const cellModel = dataToNode(response.value).childByLinkName('cellModel') as ModelNode;
        return cellModel;
      }
    }
    return null;
  }
}
