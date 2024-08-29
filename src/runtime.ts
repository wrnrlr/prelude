import {effect,sample} from './signal.ts'
import reconcileArrays from './reconcile.js'
import {SVGNamespace,SVGElements,ChildProperties,getPropAlias,Properties,Aliases,DelegatedEvents} from './constants.ts'
import type {Window,Mountable,Element,Node} from './constants.ts'

const {isArray} = Array

export type Runtime = {
  window:Window
  render(code:()=>void, element:Element, init:any): any;
  insert(parent:Mountable, accessor:any, marker?:Node|null, init?:any): any;
  spread(node:Element, accessor:any, skipChildren?: boolean): void;
  assign(node:Element, props:any, skipChildren?:boolean): void;
  element(name:string): any;
  text(s:string): any;
}

export function runtime(window:Window):Runtime {
  const document = window.document,
    isSVG = (e:any) => e instanceof (window.SVGElement as any),
    element = (name:string) => SVGElements.has(name) ? document.createElementNS("http://www.w3.org/2000/svg",name) : document.createElement(name),
    text = (s:string) => document.createTextNode(s)

  function render(code:()=>void, element:Element, init:any) {
    if (!element) throw new Error("The `element` passed to `render(..., element)` doesn't exist.");
    if (element === document) code()
    else insert(element, code(), element.firstChild ? null : undefined, init)
  }

  function insert(parent:Mountable, accessor:any, marker?:Node|null, initial?:any) {
    if (marker !== undefined && !initial) initial = [];
    if (!accessor.call) return insertExpression(parent, accessor, initial||[], marker);
    effect(current => insertExpression(parent, accessor(), current, marker), initial||[]);
  }

  function spread(node:Element, props:any = {}, skipChildren:boolean) {
    const prevProps:any = {};
    if (!skipChildren) effect(() => (prevProps.children = insertExpression(node, props.children, prevProps.children)));
    effect(() => (props.ref?.call ? sample(() => props.ref(node)) : (props.ref = node)));
    effect(() => assign(node, props, true, prevProps, true));
    return prevProps;
  }

  function assign(node:Element, props:any, skipChildren:boolean, prevProps:any = {}, skipRef:boolean = false) {
    const svg = isSVG(node)
    props || (props = {});
    for (const prop in prevProps) {
      if (!(prop in props)) {
        if (prop === "children") continue;
        prevProps[prop] = assignProp(node, prop, null, prevProps[prop], svg, skipRef);
      }
    }
    for (const prop in props) {
      if (prop === "children") {
        if (!skipChildren) insertExpression(node, props.children);
        continue;
      }
      const value = props[prop];
      prevProps[prop] = assignProp(node, prop, value, prevProps[prop], svg, skipRef);
    }
  }

  function assignProp(node:any, prop:any, value:any, prev:any, isSVG:any, skipRef:any) {
    let isCE, isProp, isChildProp, propAlias, forceProp;
    if (prop === "style") return style(node, value, prev);
    if (prop === "classList") return classList(node, value, prev);
    if (value === prev) return prev;
    if (prop === "ref") {
      if (!skipRef) value(node);
    } else if (prop.slice(0, 3) === "on:") {
      const e = prop.slice(3);
      prev && node.removeEventListener(e, prev);
      value && node.addEventListener(e, value);
    } else if (prop.slice(0, 10) === "oncapture:") {
      const e = prop.slice(10);
      prev && node.removeEventListener(e, prev, true);
      value && node.addEventListener(e, value, true);
    } else if (prop.slice(0, 2) === "on") {
      const name = prop.slice(2).toLowerCase();
      const delegate = DelegatedEvents.has(name);
      if (!delegate && prev) {
        const h = isArray(prev) ? prev[0] : prev;
        node.removeEventListener(name, h);
      }
      if (delegate || value) {
        addEventListener(node, name, value, delegate);
        delegate && delegateEvents([name],document);
      }
    } else if (prop.slice(0, 5) === "attr:") {
      setAttribute(node, prop.slice(5), value);
    } else if (
      (forceProp = prop.slice(0, 5) === "prop:") ||
      (isChildProp = ChildProperties.has(prop)) ||
      (!isSVG && ((propAlias = getPropAlias(prop, node.tagName)) || (isProp = Properties.has(prop)))) ||
      (isCE = node.nodeName.includes("-"))
    ) {
      if (forceProp) {
        prop = prop.slice(5);
        isProp = true;
      }
      if (prop === 'class' || prop === 'className') if (value) node.className = value; else node.removeAttribute('class')
      else if (isCE && !isProp && !isChildProp) node[toPropertyName(prop)] = value;
      else node[propAlias || prop] = value;
    } else {
      const ns = isSVG && prop.indexOf(":") > -1 && SVGNamespace[prop.split(":")[0]];
      if (ns) setAttributeNS(node, ns, prop, value);
      else setAttribute(node, Aliases[prop] || prop, value);
    }
    return value;
  }

  function insertExpression(parent:any, value:any, current?:any, marker?:any, unwrapArray?:any) {
    while (current?.call) current = current();
    if (value === current) return current;
    const t = typeof value,
      multi = marker !== undefined;
    parent = (multi && current[0] && current[0].parentNode) || parent;

    if (t === "string" || t === "number") {
      if (t === "number") {
        value = value.toString();
        if (value === current) return current;
      }
      if (multi) {
        let node = current[0];
        if (node && node.nodeType === 3) {
          node.data !== value && (node.data = value);
        } else node = document.createTextNode(value);
        current = cleanChildren(parent, current, marker, node);
      } else {
        if (current !== "" && typeof current === "string") {
          current = parent.firstChild.data = value;
        } else current = parent.textContent = value;
      }
    } else if (value == null || t === "boolean") {
      current = cleanChildren(parent, current, marker);
    } else if (t === "function") {
      effect(() => {
        let v = value();
        while (typeof v === "function") v = v();
        current = insertExpression(parent, v, current, marker);
      });
      return () => current;
    } else if (isArray(value)) {
      const array:any[] = [];
      const currentArray = current && isArray(current);
      if (normalizeIncomingArray(array, value, current, unwrapArray)) {
        effect(() => (current = insertExpression(parent, array, current, marker, true)));
        return () => current;
      }
      if (array.length === 0) {
        current = cleanChildren(parent, current, marker);
        if (multi) return current;
      } else if (currentArray) {
        if (current.length === 0) {
          appendNodes(parent, array, marker);
        } else reconcileArrays(parent, current, array);
      } else {
        current && cleanChildren(parent);
        appendNodes(parent, array);
      }
      current = array;
    } else if (value.nodeType) {
      if (isArray(current)) {
        if (multi) return (current = cleanChildren(parent, current, marker, value));
        cleanChildren(parent, current, null, value);
      } else if (current == null || current === "" || !parent.firstChild) {
        parent.appendChild(value);
      } else parent.replaceChild(value, parent.firstChild);
      current = value;
    } else console.warn(`Unrecognized value. Skipped inserting`, value);
    return current;
  }

  function normalizeIncomingArray(normalized:any, array:any, current:any, unwrap?:any):any {
    let dynamic = false;
    for (let i = 0, len = array.length; i < len; i++) {
      let item = array[i]
      const prev = current && current[normalized.length];
      if (item == null || item === true || item === false) {
        // matches null, undefined, true or false skip
      } else if (typeof item === "object" && item.nodeType) {
        normalized.push(item);
      } else if (isArray(item)) {
        dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
      } else if (item.call) {
        if (unwrap) {
          while (typeof item === "function") item = item();
          dynamic = normalizeIncomingArray(
              normalized,
              isArray(item) ? item : [item],
              isArray(prev) ? prev : [prev]
            ) || dynamic;
        } else {
          normalized.push(item);
          dynamic = true;
        }
      } else {
        const value = String(item);
        if (prev && prev.nodeType === 3 && prev.data === value) normalized.push(prev);
        else normalized.push(document.createTextNode(value));
      }
    }
    return dynamic;
  }

  function cleanChildren(parent:any, current?:any, marker?:any, replacement?:any):any {
    if (marker === undefined) return (parent.textContent = "");
    const node = replacement || document.createTextNode('');
    if (current.length) {
      let inserted = false;
      for (let i = current.length - 1; i >= 0; i--) {
        const el = current[i];
        if (node !== el) {
          const isParent = el.parentNode === parent;
          if (!inserted && !i)
            isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);
          else isParent && el.remove();
        } else inserted = true;
      }
    } else parent.insertBefore(node, marker);
    return [node];
  }

  return {window,render,insert,spread,assign,element,text}
}

const $$EVENTS = "_$DX_DELEGATE"

function delegateEvents(eventNames:any, document:any) {
  const e = document[$$EVENTS] || (document[$$EVENTS] = new Set());
  for (let i = 0, l = eventNames.length; i < l; i++) {
    const name = eventNames[i];
    if (!e.has(name)) {
      e.add(name);
      document.addEventListener(name, eventHandler);
    }
  }
}

function eventHandler(e:any) {
  const key = `$$${e.type}`
  let node = (e.composedPath && e.composedPath()[0]) || e.target
  // reverse Shadow DOM retargetting
  if (e.target !== node) Object.defineProperty(e, "target", {configurable: true, value: node})
  // simulate currentTarget
  Object.defineProperty(e, "currentTarget", {configurable: true, get() {return node || document}})
  while (node) {
    const handler = node[key];
    if (handler && !node.disabled) {
      const data = node[`${key}Data`];
      data !== undefined ? handler.call(node, data, e) : handler.call(node, e);
      if (e.cancelBubble) return;
    }
    node = node._$host || node.parentNode || node.host;
  }
}

// function clearDelegatedEvents(document) {
//   if (document[$$EVENTS]) {
//     for (const name of document[$$EVENTS].keys()) document.removeEventListener(name, eventHandler);
//     delete document[$$EVENTS];
//   }
// }

function setAttribute(node:any, name:any, value?:any):any {
  if (value == null) node.removeAttribute(name);
  else node.setAttribute(name, value);
}

function setAttributeNS(node:any, namespace:any, name:any, value:any):any {
  if (value == null) node.removeAttributeNS(namespace, name);
  else node.setAttributeNS(namespace, name, value);
}

function addEventListener(node:any, name:any, handler:any, delegate:any):any {
  if (delegate) {
    if (isArray(handler)) {
      node[`$$${name}`] = handler[0];
      node[`$$${name}Data`] = handler[1];
    } else node[`$$${name}`] = handler;
  } else if (isArray(handler)) {
    const handlerFn = handler[0];
    node.addEventListener(name, (handler[0] = (e:any) => handlerFn.call(node, handler[1], e)));
  } else node.addEventListener(name, handler);
}

function classList(node:any, value:any, prev:any = {}):any {
  const classKeys = Object.keys(value || {}),
    prevKeys = Object.keys(prev);
  let i, len;
  for (i = 0, len = prevKeys.length; i < len; i++) {
    const key = prevKeys[i];
    if (!key || key === "undefined" || value[key]) continue;
    toggleClassKey(node, key, false);
    delete prev[key];
  }
  for (i = 0, len = classKeys.length; i < len; i++) {
    const key = classKeys[i],
      classValue = !!value[key];
    if (!key || key === "undefined" || prev[key] === classValue || !classValue) continue;
    toggleClassKey(node, key, true);
    prev[key] = classValue;
  }
  return prev;
}

function style(node:any, value:any, prev:any) {
  if (!value) return prev ? setAttribute(node, "style") : value;
  const nodeStyle = node.style;
  if (typeof value === "string") return (nodeStyle.cssText = value);
  if (typeof prev === "string") nodeStyle.cssText = prev = undefined
  if (!prev) prev = {}
  if (!value) value = {}
  let v, s;
  for (s in prev) {
    value[s] == null && nodeStyle.removeProperty(s);
    delete prev[s];
  }
  for (s in value) {
    v = value[s];
    if (v !== prev[s]) {
      nodeStyle.setProperty(s, v);
      prev[s] = v;
    }
  }
  return prev;
}

function toPropertyName(name:any):any {
  return name.toLowerCase().replace(/-([a-z])/g, (_:any, w:string) => w.toUpperCase());
}

function toggleClassKey(node:any, key:any, value:any) {
  const classNames = key.trim().split(/\s+/);
  for (let i = 0, nameLen = classNames.length; i < nameLen; i++)
    node.classList.toggle(classNames[i], value);
}

function appendNodes(parent:any, array:any, marker:any = null) {
  for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
}