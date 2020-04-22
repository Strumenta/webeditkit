import {NodeId} from "../datamodel/misc";

export interface Observer {
    hoverNodeSet(node: NodeId | undefined) : void
}

export class EditorController {
    private observers : Observer[] = [];

    setHoverNode(node: NodeId | undefined) : void {
        for (const o of this.observers) {
            o.hoverNodeSet(node);
        }
    }
    registerObserver(observer: Observer) : void {
        this.observers.push(observer);
    }
}

const instance = new EditorController();

export function editorController() : EditorController {
    return instance
}