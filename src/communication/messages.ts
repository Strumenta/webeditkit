import {NodeData, NodeId, NodeInModel, PropertyValue} from "../datamodel/misc";

export interface Message {
    type: string;
}

export interface NodeIDInModel {
    model: string;
    id: NodeId;
}

export interface PropertyChange extends Message {
    node: NodeIDInModel;
    propertyName: string;
    propertyValue: PropertyValue;
}

export interface ReferenceChange extends Message {
    node: NodeInModel;
    referenceName: string;
    referenceValue: NodeInModel;
}

export interface NodeAdded extends Message {
    parentNodeId: NodeId;
    relationName: string;
    index: number;
    child: NodeData;
}

export interface NodeRemoved extends Message {
    parentNodeId: NodeId;
    relationName: string;
    child: NodeData;
}

export interface IssueDescription {
    message: string;
    severity: string;
    node: NodeId;
}

export interface ErrorsForModelReport extends Message {
    model: string;
    issues: IssueDescription[];
}
