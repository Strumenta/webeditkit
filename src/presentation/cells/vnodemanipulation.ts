import { VNode } from 'snabbdom/vnode';
import { InsertHook, UpdateHook } from 'snabbdom/hooks';

import merge from 'lodash.merge';

export function addInsertHook(vnode: VNode, hook: InsertHook): VNode {
  if (vnode.data === undefined) {
    vnode.data = {};
  }
  if (vnode.data.hook === undefined) {
    vnode.data.hook = {};
  }
  vnode.data.hook.insert = hook;
  return vnode;
}

export function wrapInsertHook(vnode: VNode, hook: InsertHook): VNode {
  if (vnode.data === undefined) {
    vnode.data = {};
  }
  if (vnode.data.hook === undefined) {
    vnode.data.hook = {};
  }
  if (vnode.data.hook.insert == null) {
    vnode.data.hook.insert = hook;
  } else {
    const oldHook = vnode.data.hook.insert;
    vnode.data.hook.insert = (vNode: VNode): any => {
      hook(vNode);
      return oldHook(vNode);
    };
  }
  return vnode;
}

export function wrapUpdateHook(vnode: VNode, hook: UpdateHook): VNode {
  if (vnode.data === undefined) {
    vnode.data = {};
  }
  if (vnode.data.hook === undefined) {
    vnode.data.hook = {};
  }
  if (vnode.data.hook.update == null) {
    vnode.data.hook.update = hook;
  } else {
    const oldHook = vnode.data.hook.update;
    vnode.data.hook.update = (oldVNode: VNode, vNode: VNode): any => {
      hook(oldVNode, vNode);
      return oldHook(oldVNode, vNode);
    };
  }
  return vnode;
}

export function wrapKeydownHandler(vnode: VNode, keydownHandler: (event: KeyboardEvent) => boolean): VNode {
  if (vnode.data === undefined) {
    vnode.data = {};
  }
  if (vnode.data.on === undefined) {
    vnode.data.on = {};
  }
  if (vnode.data.on.keydown === undefined) {
    vnode.data.on.keydown = keydownHandler;
  } else {
    const original = vnode.data.on.keydown;
    vnode.data.on.keydown = (event) => {
      const res = keydownHandler(event);
      if (res) {
        return original(event);
      } else {
        return res;
      }
    };
  }
  return vnode;
}

export function wrapKeypressHandler(vnode: VNode, handler: (event: KeyboardEvent) => boolean): VNode {
  if (vnode.data === undefined) {
    vnode.data = {};
  }
  if (vnode.data.on === undefined) {
    vnode.data.on = {};
  }
  if (vnode.data.on.keypress === undefined) {
    vnode.data.on.keypress = handler;
  } else {
    const original = vnode.data.on.keypress;
    vnode.data.on.keypress = (event) => {
      const res = handler(event);
      if (res) {
        return original(event);
      } else {
        return res;
      }
    };
  }
  return vnode;
}

export function wrapMouseOverHandler(vnode: VNode, hoverHandler: (event: MouseEvent) => boolean): VNode {
  if (vnode.data === undefined) {
    vnode.data = {};
  }
  if (vnode.data.on === undefined) {
    vnode.data.on = {};
  }
  if (vnode.data.on.mouseover === undefined) {
    vnode.data.on.mouseover = hoverHandler;
  } else {
    const original = vnode.data.on.mouseover;
    vnode.data.on.mouseover = (event: MouseEvent) => {
      const res = hoverHandler(event);
      if (res) {
        return original(event);
      } else {
        return res;
      }
    };
  }
  return vnode;
}

export function wrapMouseOutHandler(vnode: VNode, hoverHandler: (event: MouseEvent) => boolean): VNode {
  if (vnode.data === undefined) {
    vnode.data = {};
  }
  if (vnode.data.on === undefined) {
    vnode.data.on = {};
  }
  if (vnode.data.on.mouseout === undefined) {
    vnode.data.on.mouseout = hoverHandler;
  } else {
    const original = vnode.data.on.mouseout;
    vnode.data.on.mouseout = (event: MouseEvent) => {
      const res = hoverHandler(event);
      if (res) {
        return original(event);
      } else {
        return res;
      }
    };
  }
  return vnode;
}

export function addClass(vnode: VNode, className: string): VNode {
  vnode.sel += '.' + className;
  return vnode;
}

export function setDataset(vnode: VNode, dataset: Record<string, any>): VNode {
  if (vnode.data === undefined) {
    vnode.data = {};
  }
  vnode.data.dataset = dataset;
  return vnode;
}

export function addToDataset(vnode: VNode, key: string, value: any): VNode {
  if (vnode.data === undefined) {
    vnode.data = {};
  }
  if (vnode.data.dataset === undefined) {
    vnode.data.dataset = {};
  }
  vnode.data.dataset[key] = value;
  return vnode;
}

export function addToDatasetObj(vnode: VNode, dataObj: Record<string, unknown>): VNode {
  if (vnode.data === undefined) {
    vnode.data = {};
  }
  if (vnode.data.dataset === undefined) {
    vnode.data.dataset = {};
  }
  vnode.data.dataset = merge(vnode.data.dataset, dataObj);
  return vnode;
}

export function setKey(vnode: VNode, key: string): VNode {
  vnode.key = key;
  return vnode;
}

export function addId(vnode: VNode, myId: string): VNode {
  const tagNameAndClasses = (vnode.sel ?? '').split(/\.(.+)/);
  const tagName = tagNameAndClasses[0];
  const classes = tagNameAndClasses[1];
  vnode.sel = tagName + '#' + myId;
  if (classes !== undefined) {
    vnode.sel += '.' + classes;
  }
  return vnode;
}
