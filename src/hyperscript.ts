import type {DOMElements} from './constants.ts'
import type {Mountable} from './runtime.ts'
import {r} from './runtime.ts'

// const document = globalThis.document

export const h = hyperscript(r)

type MountableElement = Element | Document | ShadowRoot | DocumentFragment | Node

interface Runtime {
  insert(parent: MountableElement, accessor: any, marker?: Node | null, init?: any): any;
  spread(node: Element, accessor: any, isSVG?: Boolean, skipChildren?: Boolean): void;
  assign(node: Element, props: any, isSVG?: Boolean, skipChildren?: Boolean): void;
  component(Comp: (props: any) => any, props: any): any;
  SVGElements: Set<string>;
}

const $ELEMENT = Symbol("hyper-element");

type ExpandableNode = Node & { [key: string]: any };
type Props = { [key: string]: any };

export type HyperScript = {
  (...args: any[]): () => ExpandableNode | ExpandableNode[];
  Fragment: (props: {
    children: (() => ExpandableNode) | (() => ExpandableNode)[];
  }) => ExpandableNode[];
};

// Inspired by https://github.com/hyperhype/hyperscript
export function hyperscript(r: Runtime): HyperScript {
  function h() {
    let args: any = [].slice.call(arguments),
      e: ExpandableNode | undefined,
      classes:string[] = [],
      multiExpression = false;

    while (Array.isArray(args[0])) args = args[0];
    if (args[0][$ELEMENT]) args.unshift(h.Fragment);
    typeof args[0] === "string" && detectMultiExpression(args);
    const ret: (() => ExpandableNode) & { [$ELEMENT]?: boolean } = () => {
      while (args.length) item(args.shift());
      if (e instanceof globalThis.Element && classes.length) e.classList.add(...classes)
      return e as ExpandableNode;
    };
    ret[$ELEMENT] = true;
    return ret;

    function item(l: any) {
      const type = typeof l;
      if (l == null) void 0;
      else if ("string" === type) {
        if (!e) parseHtmlTag(l);
        else e.appendChild(globalThis.document.createTextNode(l));
      } else if (
        "number" === type ||
        "boolean" === type ||
        "bigint" === type ||
        "symbol" === type ||
        l instanceof Date ||
        l instanceof RegExp
      ) {
        (e as Node).appendChild(globalThis.document.createTextNode(l.toString()));
      } else if (Array.isArray(l)) {
        for (let i = 0; i < l.length; i++) item(l[i]);
      } else if (l instanceof globalThis.Element) {
        r.insert(e as globalThis.Element, l, multiExpression ? null : undefined);
      } else if ("object" === type) {
        let dynamic = false;
        const d = Object.getOwnPropertyDescriptors(l);
        for (const k in d) {
          if (k === "class" && classes.length !== 0) {
            console.log('classes',classes)
            const fixedClasses = classes.join(" "),
              value = typeof d["class"].value === "function" ?
                ()=>[...classes,...(d["class"].value()??'').split(' ')].filter(c=>c).join(' ') :
                [...classes,...(d["class"].value??'').split(' ')].filter(c=>c).join(' ')
            Object.defineProperty(l,"class",{...d[k],value})
            // classes = []
          }
          if (k !== "ref" && k.slice(0, 2) !== "on" && typeof d[k].value === "function") {
            dynamicProperty(l, k);
            dynamic = true;
          } else if (d[k].get) dynamic = true;
        }
        dynamic
          ? r.spread(e as globalThis.Element, l, !!args.length)
          : r.assign(e as globalThis.Element, l, !!args.length);
      } else if ("function" === type) {
        if (!e) {
          let props: Props | undefined,
            next = args[0];
          if (
            next == null ||
            (typeof next === "object" && !Array.isArray(next) && !(next instanceof globalThis.Element))
          )
            props = args.shift();
          props || (props = {});
          if (args.length) {
            props.children = args.length > 1 ? args : args[0];
          }
          const d = Object.getOwnPropertyDescriptors(props);
          for (const k in d) {
            if (Array.isArray(d[k].value)) {
              const list = d[k].value;
              props[k] = () => {
                for (let i = 0; i < list.length; i++) {
                  while (list[i][$ELEMENT]) list[i] = list[i]();
                }
                return list;
              };
              dynamicProperty(props, k);
            } else if (typeof d[k].value === "function" && !d[k].value.length)
              dynamicProperty(props, k);
          }
          e = r.component(l, props);
          args = [];
        } else {
          while ((l as any)[$ELEMENT]) l = ((l as unknown) as () => ExpandableNode)();
          r.insert(e as globalThis.Element, l, multiExpression ? null : undefined);
        }
      }
    }
    function parseHtmlTag(s: string) {
      let i:number

      i = s.indexOf('#')
      if (i===-1) i = s.indexOf('.')
      if (i===-1) i = s.length
      const name = s.slice(0, i) || 'div'
      e = r.SVGElements.has(name)
        ? globalThis.document.createElementNS("http://www.w3.org/2000/svg", name)
        : globalThis.document.createElement(name);
      s = s.slice(i)

      if (s[0]==='#') {
        i = s.indexOf('.')
        if (i===-1) i = s.length
        e!.setAttribute("id", s.slice(1, i))
        s = s.slice(i)
      }

      while(s[0]==='.') {
        i = s.indexOf('.',1)
        if (i===-1) i = s.length
        classes.push(s.slice(1, i))
        s = s.slice(i)
      }
    }
    function parseClass(string: string) {
      const m = string.split(/([\.#]?[^\s#.]+)/);
      if (/^\.|#/.test(m[1])) e = globalThis.document.createElement("div");
      for (let i = 0; i < m.length; i++) {
        let v = m[i]
        const s = v.substring(1, v.length);
        if (!v) v = 'div';
        if (!e)
          e = r.SVGElements.has(v)
            ? globalThis.document.createElementNS("http://www.w3.org/2000/svg", v)
            : globalThis.document.createElement(v);
        if (v[0] === ".") classes.push(s);
        else if (v[0] === "#") e.setAttribute("id", s);
      }
    }
    function detectMultiExpression(list: any[]) {
      for (let i = 1; i < list.length; i++) {
        if (typeof list[i] === "function") {
          multiExpression = true;
          return;
        } else if (Array.isArray(list[i])) {
          detectMultiExpression(list[i]);
        }
      }
    }
  }

  h.Fragment = (props: any) => props.children;
  return h;
}


// ^([a-zA-Z]\w*)?(#[a-zA-Z][-\w]*)?(.[a-zA-Z][-\w]*)*
// export function parseHtmlTag(s:Tag) {
//   const classes:string[] = [];
//   let id:string|undefined = undefined, i:number

//   i = s.indexOf('#')
//   if (i===-1) i = s.indexOf('.')
//   if (i===-1) i = s.length
//   const name = s.slice(0, i) || 'div'
//   s = s.slice(i)

//   if (s[0]==='#') {
//     i = s.indexOf('.')
//     if (i===-1) i = s.length
//     id = s.slice(1, i)
//     s = s.slice(i)
//   }

//   while(s[0]==='.') {
//     i = s.indexOf('.',1)
//     if (i===-1) i = s.length
//     classes.push(s.slice(1, i))
//     s = s.slice(i)
//   }
//   return {name:name as string,classes,id:id}
// }

function dynamicProperty<T>(props: Record<string, unknown>, key: string) {
  const src = props[key] as ()=>unknown
  Object.defineProperty(props, key, {get() {return src()}, enumerable:true})
  // return props
}

// function tw(rules) {
//   const classes = (classes) => classes.filter(c=>!rules.some(r=>c.match(r[0]))).join(' ')
//   const styles = (classes) => classes.reduce((acc,c) => {
//     for (const r of rules) {
//       const m = c.match(r[0])
//       if (m) acc.push(r[1](...m.splice(1)))
//     }
//     return acc
//   },[]).join(';')
//   return props => {
//     if (!props.class) return
//     const cd = Object.getOwnPropertyDescriptor(props,'class'), cf = typeof cd.value === 'function'
//     props.class = cf ? ()=>classes(cd.value().split(' ')) : classes(cd.value.split(' '))
//     if (!props.style) props.style = cf ? ()=>styles(cd.value().split(' ')) : styles(cd.value.split(' '))
//     else {
//       const sd = Object.getOwnPropertyDescriptor(props,'style'), sf = typeof sd.value === 'function'
//       if (cf) props.style = sf ? ()=>styles(cd.value().split(' ')) + ';' + sd.value() : ()=>styles(cd.value().split(' ')) + ';' + sd.value
//       else {
//         const ca = styles(cd.value.split(' '))
//         props.style = sf ? () => ca +  ';' + sd.value() : ca + ';' + sd.value
//       }
//     }
//   }
// }

// const spacing = {p:'padding', m:'margin'}
// const toDirection = {b:'bottom', l:'left', r:'right', t:'top'}
// const toSurface = {bg:'background',text:'text',border:'border',outline:'outline'}
// const alignContent = {start:'flex-start',center:'center',end:'flex-end',between:'space-between',around:'space-around',evenly:'space-evenly'}
// const toColor = (name,weight) => 'red'

// const rules = [
//   // padding & margin
//   [/([pm])-(\d+)/, (pm,size)=>`${spacing[pm]}:${size/4}rem`],
//   // border
//   // [/b-%d/, (width)=>({'border-size':width})]
//   // bg & text & border & outline
//   // [/(bg|text|border|outline)-\W+-\d+/, (style,color,weight)=>({[toSurface[style]]:toColor(color,weight)})],
//   // display
//   // [/(block|inline|inline-block|flex|inline-flex|none)/, (display)=>({display})],
//   // [/items-(start|center|end|stretch|baseline)/, (pos)=>({'align-items':pos})],
//   // [/justify-(start|center|end|stretch|baseline)/, (pos)=>({'justify-content':pos})],
//   // [/content-(start|center|end|between|around|evenly)/, (pos)=>({'align-content':alignContent[pos]})],
//   // [/self-(auto|start|center|end|stretch|baseline)/, (pos)=>({'aligh-self':pos})],
// ]
