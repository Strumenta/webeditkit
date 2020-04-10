//
/// Messages - start
///

import {NodeData, NodeId, NodeInModel, PropertyType} from "../datamodel/misc";

export interface Message {
    type: string;
}

export interface PropertyChange extends Message {
    propertyName: string;
    propertyValue: PropertyType;
    nodeId: NodeId;
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

///
/// Messages - end
///