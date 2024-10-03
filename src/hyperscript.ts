import {sample} from './signal.ts'
import {Properties,BooleanAttributes,DelegatedEvents,DOMElements, type Mountable} from './constants.ts'
import type {Runtime,$RUNTIME} from './runtime.ts'

const ELEMENT = Symbol(), {isArray} = Array

export type PropsKeys = typeof Properties extends Set<infer K> ? K : never;
export type BooleanProps = typeof BooleanAttributes extends Set<infer K> ? K : never;
export type HandlerProps = typeof DelegatedEvents extends Set<infer K> ? K : never;
export type ChildProps = {children?:any[]}

export type ElementProps = BooleanProps & HandlerProps & ChildProps & {class: string}
export type ComponentProps = { children?:Child }

/**
 * @group Hyperscript
 */
export type Props = {}

type AllProps = ElementProps | ComponentProps

type EmptyProps = Record<string,never>

/**
@group Hyperscript
*/
export type HyperScript = {
  (element:Tag, props:ElementProps, children:Child): View
  (element:Tag, props:ElementProps): View
  (element:Tag, children:Child): View
  (element:Tag): View

  <T,K>(element:Component<T & {children:K}>, props:T, children:K): View
  <T>(element:Component<T>, props:T): View
  <K>(element:Component<{children:K}>, children:K): View
  (element:Component<undefined>): View
}

/**
 * @group Hyperscript
 */
export type Child = { call:any } | Child[] | string | number | symbol | bigint | boolean | Record<string,unknown> | {():Child, [ELEMENT]:Runtime}
/**
 * @group Hyperscript
 */
export type View = {():void, [ELEMENT]?:Runtime}
/**
 * @group Hyperscript
 */
export type Component<T> = {(props:T): Mountable, [ELEMENT]?: Runtime}
/**
 * @group Hyperscript
 */
export type Tag = typeof DOMElements extends Set<infer K> ? K : never;

// const Fragment:Component<Props> = <T extends Props>(props:T):Mountable => (props as any).children

/**

@param r
@param patch
@group Hyperscript
*/
export function hyperscript(r:Runtime, patch?:any):HyperScript {

  function item<T extends Props>(e: Element|Element[], c: Child, m?: null) {
    if (c===null) return
    if (isArray(c))
      for (const child of c)
        item(e, child, m)
    else if (r.isChild(c))
      r.insert(e, c, m)
    else if (typeof c==='string')
      (e as Element).appendChild(r.text(c))
    else if ((c as any).call) {
      while ((c as any)[ELEMENT]?.call) c = (c as any)()
      r.insert(e, c, m)
    } else (e as Element).appendChild(r.text(c.toString()))
  }

  return function h<T,K=unknown>(
    element:Component<T&{children:K}>|Tag,
    props?:T|K|Child,
    children?:K|Child
  ): View {

    const t2 = typeof props
    if (isArray(props) || t2==='string' || t2==='function') {
      (children as Child) = (props) || []
      props = {} as T&{children:K}
    } else {
      (children as Child) = children || [];
      props = ((props ?? {}) as T&{children:K})
    }


    let ret:View

    if ((element as Component<T>).call) {
      const d = Object.getOwnPropertyDescriptors(props)
      if (children) (props as any).children = children
      for (const k in d) {
        if (isArray(d[k].value)) {
          const list:any[] = d[k].value;
          (props as any)[k] = () => {
            for (let i = 0; i < list.length; i++)
              while (list[i][ELEMENT]) list[i] = list[i]()
            return list
          }
          dynamicProperty(props as any, k)
        } else if (d[k].value?.call && !d[k].value.length) { // A function with zero arguments
          dynamicProperty(props as any, k)
        }
      }
      ret = () => sample(()=>(element as Component<T&{children:K}>)(props as T&{children:K}))
    } else {
      r = (element as any)[ELEMENT] as Runtime || r
      const tag = parseTag(element as Tag)
      const multiExpression = detectMultiExpression(children) ? null : undefined
      const e = r.element(tag.name)
      ret = () => {
        const props2 = props as T
        if (tag.id) e.setAttribute('id',tag.id)
        if (tag.classes?.length) {
          const cd = Object.getOwnPropertyDescriptor(props2,'class') ?? ({value:'',writable:true,enumerable:true} as any);
          (props2 as any).class = (!cd.value.call) ?
            [...tag.classes,...cd.value.split(' ')].filter(c=>c).join(' ') :
            () => [...tag.classes,...cd.value().split(' ')].filter(c=>c).join(' ')
        }
        if (patch) patch(props2)
        let dynamic = r.assign
        const d = Object.getOwnPropertyDescriptors(props2)
        for (const k in d) {
          if (k !== "ref" && !k.startsWith('on') && d[k].value?.call) {
            dynamicProperty(props2 as any, k)
            dynamic = r.spread
          } else if (d[k].get) dynamic = r.spread
        }
        dynamic(e, props2, !!(children as Child[])?.length)
        item(e,children as any,multiExpression)
        return e
      }
    }
    ret[ELEMENT] = r
    return ret
  }
}

function detectMultiExpression(list:any):boolean {
  if (list.call) return true
  else if (!isArray(list)) return false
  for (const i of list) {
    if (i.call) return true
    else if (isArray(i)) return detectMultiExpression(i)
  }
  return false
}

// ^([a-zA-Z]\w*)?(#[a-zA-Z][-\w]*)?(.[a-zA-Z][-\w]*)*
function parseTag(tag:Tag):{name:string,id?:string,classes:string[]} {
  const classes:string[] = [];
  let name, id
  const m = tag.split(/([\.#]?[^\s#.]+)/)
  if (/^\.|#/.test(m[1])) name = 'div'
  for (const v of m) {
    if (!v) continue
    if (!name) name = v
    else if (v[0] === ".") classes.push(v.slice(1))
    else if (v[0] === "#") id = v.slice(1)
  }
  return {name:name as string,classes,id}
}

function dynamicProperty(props:Record<string,any>, key:string):Record<string,any> {
  const src = props[key]
  Object.defineProperty(props, key, {get() {return src()},enumerable:true})
  return props
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
