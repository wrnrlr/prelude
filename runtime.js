import S from './s.ts'
import reconcileArrays from './reconcile.js'
import {SVGElements,ChildProperties,getPropAlias,Properties,Aliases,DelegatedEvents} from './constants.ts'
export {Properties, ChildProperties, getPropAlias, Aliases, DOMElements, SVGElements, SVGNamespace, DelegatedEvents} from './constants.ts'

// const currentContext = null;
// only used during hydration???
const sharedConfig = {};
// const getOwner = null;

const root = S.root
const sample = S.sample
const effect = S

const $$EVENTS = "_$DX_DELEGATE"

export function runtime(window) {
  const {document,Element,SVGElement} = window,
    isSVG = e => e instanceof SVGElement,
    createElement = name => SVGElements.has(name) ? document.createElementNS("http://www.w3.org/2000/svg",name) : document.createElement(name),
    createTextNode = s => document.createTextNode(s)

  function archetype(a) {
    let t = typeof a
    if (t==='object') {
      if (Array.isArray(a)) t = 'array'
      else if (a instanceof RegExp) t = 'regexp'
      else if (a instanceof Date) t = 'date'
      else if (a instanceof Element) t = 'element'
    }
    return t
  }

  function render(code, element, init, options = {}) {
    if (!element) throw new Error("The `element` passed to `render(..., element)` doesn't exist. Make sure `element` exists in the document.");
    if (element === document) code()
    else insert(element, code(), element.firstChild ? null : undefined, init)
  }

  function template(html, isCE, isSVG) {
    let node;
    const create = () => {
      if (sharedConfig.context) throw new Error("Failed attempt to create new DOM elements during hydration. Check that the libraries you are using support hydration.");
      const t = document.createElement("template");
      t.insertAdjacentHTML('afterbegin',html)
      // t.innerHTML = html;
      return isSVG ? t.content.firstChild.firstChild : t.content.firstChild;
    };
    // backwards compatible with older builds
    const fn = isCE
      ? () => sample(() => document.importNode(node || (node = create()), true))
      : () => (node || (node = create())).cloneNode(true);
    fn.cloneNode = fn;
    return fn;
  }

  function delegateEvents(eventNames, document = window.document) {
    const e = document[$$EVENTS] || (document[$$EVENTS] = new Set());
    for (let i = 0, l = eventNames.length; i < l; i++) {
      const name = eventNames[i];
      if (!e.has(name)) {
        e.add(name);
        document.addEventListener(name, eventHandler);
      }
    }
  }

  function clearDelegatedEvents(document = window.document) {
    if (document[$$EVENTS]) {
      for (const name of document[$$EVENTS].keys()) document.removeEventListener(name, eventHandler);
      delete document[$$EVENTS];
    }
  }

  function spread(node, props = {}, isSVG, skipChildren) {
    const prevProps = {};
    if (!skipChildren) effect(() => (prevProps.children = insertExpression(node, props.children, prevProps.children)));
    effect(() => (typeof props.ref === "function" ? use(props.ref, node) : (props.ref = node)));
    effect(() => assign(node, props, isSVG, true, prevProps, true));
    return prevProps;
  }

  // TODO inline?
  function use(fn, element, arg) {
    return sample(() => fn(element, arg));
  }

  function insert(parent, accessor, marker, initial) {
    if (marker !== undefined && !initial) initial = [];
    if (typeof accessor !== "function") return insertExpression(parent, accessor, initial, marker);
    effect(current => insertExpression(parent, accessor(), current, marker), initial);
  }

  function assign(node, props, isSVG, skipChildren, prevProps = {}, skipRef = false) {
    props || (props = {});
    for (const prop in prevProps) {
      if (!(prop in props)) {
        if (prop === "children") continue;
        prevProps[prop] = assignProp(node, prop, null, prevProps[prop], isSVG, skipRef);
      }
    }
    for (const prop in props) {
      if (prop === "children") {
        if (!skipChildren) insertExpression(node, props.children);
        continue;
      }
      const value = props[prop];
      prevProps[prop] = assignProp(node, prop, value, prevProps[prop], isSVG, skipRef);
    }
  }

  function assignProp(node, prop, value, prev, isSVG, skipRef) {
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
        const h = Array.isArray(prev) ? prev[0] : prev;
        node.removeEventListener(name, h);
      }
      if (delegate || value) {
        addEventListener(node, name, value, delegate);
        delegate && delegateEvents([name]);
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
      } else if (!!sharedConfig.context && node.isConnected) return value;
      if (prop === "class" || prop === "className") setClassName(node, value);
      else if (isCE && !isProp && !isChildProp) node[toPropertyName(prop)] = value;
      else node[propAlias || prop] = value;
    } else {
      const ns = isSVG && prop.indexOf(":") > -1 && SVGNamespace[prop.split(":")[0]];
      if (ns) setAttributeNS(node, ns, prop, value);
      else setAttribute(node, Aliases[prop] || prop, value);
    }
    return value;
  }

  function insertExpression(parent, value, current, marker, unwrapArray) {
    // const hydrating = !!sharedConfig.context && parent.isConnected;
    // if (hydrating) {
    //   !current && (current = [...parent.childNodes]);
    //   const cleaned = [];
    //   for (let i = 0; i < current.length; i++) {
    //     const node = current[i];
    //     if (node.nodeType === 8 && node.data.slice(0, 2) === "!$") node.remove();
    //     else cleaned.push(node);
    //   }
    //   current = cleaned;
    // }
    while (typeof current === "function") current = current();
    if (value === current) return current;
    const t = typeof value,
      multi = marker !== undefined;
    parent = (multi && current[0] && current[0].parentNode) || parent;

    if (t === "string" || t === "number") {
      // if (hydrating) return current;
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
      // if (hydrating) return current;
      current = cleanChildren(parent, current, marker);
    } else if (t === "function") {
      effect(() => {
        let v = value();
        while (typeof v === "function") v = v();
        current = insertExpression(parent, v, current, marker);
      });
      return () => current;
    } else if (Array.isArray(value)) {
      const array = [];
      const currentArray = current && Array.isArray(current);
      if (normalizeIncomingArray(array, value, current, unwrapArray)) {
        effect(() => (current = insertExpression(parent, array, current, marker, true)));
        return () => current;
      }
      // if (hydrating) {
      //   if (!array.length) return current;
      //   if (marker === undefined) return [...parent.childNodes];
      //   let node = array[0];
      //   const nodes = [node];
      //   while ((node = node.nextSibling) !== marker) nodes.push(node);
      //   return (current = nodes);
      // }
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
      // if (hydrating && value.parentNode) return (current = multi ? [value] : value);
      if (Array.isArray(current)) {
        if (multi) return (current = cleanChildren(parent, current, marker, value));
        cleanChildren(parent, current, null, value);
      } else if (current == null || current === "" || !parent.firstChild) {
        parent.appendChild(value);
      } else parent.replaceChild(value, parent.firstChild);
      current = value;
    } else console.warn(`Unrecognized value. Skipped inserting`, value);

    return current;
  }

  function normalizeIncomingArray(normalized, array, current, unwrap) {
    console.log('normalizeIncomingArray',normalized,array,current,unwrap)
    let dynamic = false;
    for (let i = 0, len = array.length; i < len; i++) {
      let item = array[i], t
      const prev = current && current[normalized.length];
      if (item == null || item === true || item === false) {
        // matches null, undefined, true or false skip
      } else if ((t = typeof item) === "object" && item.nodeType) {
        normalized.push(item);
      } else if (Array.isArray(item)) {
        dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
      } else if (t === "function") {
        if (unwrap) {
          while (typeof item === "function") item = item();
          dynamic = normalizeIncomingArray(
              normalized,
              Array.isArray(item) ? item : [item],
              Array.isArray(prev) ? prev : [prev]
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

  function cleanChildren(parent, current, marker, replacement) {
    if (marker === undefined) return (parent.textContent = "");
    const node = replacement || document.createTextNode("");
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

  return {archetype, spread, assign, insert, createComponent, createElement, createTextNode, render, isSVG,clearDelegatedEvents}
}

// function setProperty(node, name, value) {
//   if (!!sharedConfig.context && node.isConnected) return;
//   node[name] = value;
// }

// TODO this can just be reduced to the sample(() => Comp(props))
export function createComponent(Comp, props) {
  if (Comp.prototype?.isClassComponent) {
    return sample(() => {
      const comp = new Comp(props);
      return comp.render(props);
    });
  }
  return sample(() => Comp(props));
}

function setAttribute(node, name, value) {
  if (!!sharedConfig.context && node.isConnected) return;
  if (value == null) node.removeAttribute(name);
  else node.setAttribute(name, value);
}

function setAttributeNS(node, namespace, name, value) {
  if (!!sharedConfig.context && node.isConnected) return;
  if (value == null) node.removeAttributeNS(namespace, name);
  else node.setAttributeNS(namespace, name, value);
}

function setClassName(node, value) {
  if (!!sharedConfig.context && node.isConnected) return;
  if (value == null) node.removeAttribute("class");
  else node.className = value;
}

function addEventListener(node, name, handler, delegate) {
  if (delegate) {
    if (Array.isArray(handler)) {
      node[`$$${name}`] = handler[0];
      node[`$$${name}Data`] = handler[1];
    } else node[`$$${name}`] = handler;
  } else if (Array.isArray(handler)) {
    const handlerFn = handler[0];
    node.addEventListener(name, (handler[0] = e => handlerFn.call(node, handler[1], e)));
  } else node.addEventListener(name, handler);
}

function classList(node, value, prev = {}) {
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

function style(node, value, prev) {
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

// Internal Functions
function toPropertyName(name) {
  return name.toLowerCase().replace(/-([a-z])/g, (_, w) => w.toUpperCase());
}

function toggleClassKey(node, key, value) {
  const classNames = key.trim().split(/\s+/);
  for (let i = 0, nameLen = classNames.length; i < nameLen; i++)
    node.classList.toggle(classNames[i], value);
}

function eventHandler(e) {
  const key = `$$${e.type}`;
  let node = (e.composedPath && e.composedPath()[0]) || e.target;
  // reverse Shadow DOM retargetting
  if (e.target !== node) Object.defineProperty(e, "target", { configurable: true, value: node });

  // simulate currentTarget
  Object.defineProperty(e, "currentTarget", { configurable: true, get() { return node || document; } });

  // cancel html streaming
  if (sharedConfig.registry && !sharedConfig.done) sharedConfig.done = _$HY.done = true;

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

function appendNodes(parent, array, marker = null) {
  for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
}

// const propTraps = {
//   get(_, property) {return _.get(property)},
//   has(_, property) {return _.has(property)},
//   set: trueFn,
//   deleteProperty: trueFn,
//   getOwnPropertyDescriptor(_, property) {
//     return {
//       configurable: true,
//       enumerable: true,
//       get() {return _.get(property);},
//       set: trueFn,
//       deleteProperty: trueFn
//     };
//   },
//   ownKeys(_) {return _.keys();}
// };

// function trueFn() {return true;}

// function resolveSource(s) {
//   return (s = typeof s === "function" ? s() : s) == null ? {} : s;
// }

// function mergeProps(...sources) {
//   return new Proxy(
//     {
//       get(property) {
//         for (let i = sources.length - 1; i >= 0; i--) {
//           const v = resolveSource(sources[i])[property];
//           if (v !== undefined) return v;
//         }
//       },
//       has(property) {
//         for (let i = sources.length - 1; i >= 0; i--) {
//           if (property in resolveSource(sources[i])) return true;
//         }
//         return false;
//       },
//       keys() {
//         const keys = [];
//         for (let i = 0; i < sources.length; i++)
//           keys.push(...Object.keys(resolveSource(sources[i])));
//         return [...new Set(keys)];
//       }
//     },
//     propTraps
//   );
// }

// Hydrate
// export function hydrate(code, element, options = {}) {
//   sharedConfig.completed = globalThis._$HY.completed;
//   sharedConfig.events = globalThis._$HY.events;
//   sharedConfig.load = id => globalThis._$HY.r[id];
//   sharedConfig.has = id => id in globalThis._$HY.r;
//   sharedConfig.gather = root => gatherHydratable(element, root);
//   sharedConfig.registry = new Map();
//   sharedConfig.context = {
//     id: options.renderId || "",
//     count: 0
//   };
//   gatherHydratable(element, options.renderId);
//   const dispose = render(code, element, [...element.childNodes], options);
//   sharedConfig.context = null;
//   return dispose;
// }

// function getNextElement(template) {
//   let node, key;
//   // if (!sharedConfig.context || !(node = sharedConfig.registry.get((key = getHydrationKey())))) {
//   //   if ("_DX_DEV_" && sharedConfig.context)
//   //     throw new Error(`Hydration Mismatch. Unable to find DOM nodes for hydration key: ${key}`);
//   //   return template();
//   // }
//   if (sharedConfig.completed) sharedConfig.completed.add(node);
//   sharedConfig.registry.delete(key);
//   return node;
// }

// function getNextMatch(el, nodeName) {
//   while (el && el.localName !== nodeName) el = el.nextSibling;
//   return el;
// }

// function getNextMarker(start) {
//   let end = start,
//     count = 0,
//     current = [];
//   if (sharedConfig.context) {
//     while (end) {
//       if (end.nodeType === 8) {
//         const v = end.nodeValue;
//         if (v === "$") count++;
//         else if (v === "/") {
//           if (count === 0) return [end, current];
//           count--;
//         }
//       }
//       current.push(end);
//       end = end.nextSibling;
//     }
//   }
//   return [end, current];
// }

// function runHydrationEvents() {
//   if (sharedConfig.events && !sharedConfig.events.queued) {
//     queueMicrotask(() => {
//       const { completed, events } = sharedConfig;
//       events.queued = false;
//       while (events.length) {
//         const [el, e] = events[0];
//         if (!completed.has(el)) return;
//         eventHandler(e);
//         events.shift();
//       }
//     });
//     sharedConfig.events.queued = true;
//   }
// }

// function gatherHydratable(element, root) {
//   const templates = element.querySelectorAll(`*[data-hk]`);
//   for (let i = 0; i < templates.length; i++) {
//     const node = templates[i];
//     const key = node.getAttribute("data-hk");
//     if ((!root || key.startsWith(root)) && !sharedConfig.registry.has(key))
//       sharedConfig.registry.set(key, node);
//   }
// }

// export function getHydrationKey() {
//   const hydrate = sharedConfig.context;
//   return `${hydrate.id}${hydrate.count++}`;
// }

// export function NoHydration(props) {
//   return sharedConfig.context ? undefined : props.children;
// }

// export function Hydration(props) {
//   return props.children;
// }

// const voidFn = () => undefined;

// experimental
export const RequestContext = Symbol();

// deprecated
// export function innerHTML(parent, content) {
//   !sharedConfig.context && (parent.innerHTML = content);
// }