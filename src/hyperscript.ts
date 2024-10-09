import {sample} from './reactive.ts'
import {Properties,BooleanAttributes,DelegatedEvents,DOMElements, type Mountable} from './constants.ts'
import type {Runtime,$RUNTIME} from './runtime.ts'

const ELEMENT: unique symbol = Symbol(), {isArray} = Array

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
  // (children:Child[]): View

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
export type Child = { call:any } | Child[] | string | number | symbol | bigint | boolean | Record<string,unknown> | {():Child, [ELEMENT]:boolean}
/**
 * @group Hyperscript
 */
export type View = {():void, [ELEMENT]?:boolean}
/**
 * @group Hyperscript
 */
export type Component<T> = {(props:T): Mountable, [ELEMENT]?: Runtime}
/**
 * @group Hyperscript
 */
export type Tag = typeof DOMElements extends Set<infer K> ? K : never;

const Fragment:Component<Props> = <T extends Props>(props:T):Mountable => (props as any).children

/**

@param r
@param patch
@group Hyperscript
*/
export function hyperscript(r:Runtime, patch?:any):HyperScript {

  function item<T extends Props>(e: Element, c: Child, m?: null) {
    if (c===null) return
    if (isArray(c))
      for (const child of c)
        item(e, child, m)
    else if (typeof c === 'object' && r.isChild(c))
      r.insert(e, c, m)
    else if (typeof c==='string')
      (e as Element).appendChild(r.text(c))
    else if ((c as any).call) {
      while ((c as any)[ELEMENT]?.call) c = (c as any)()
      r.insert(e, c, m)
    } else (e as Element).appendChild(r.text(c.toString()))
  }

  return function h<T,K=unknown>(
    element:Component<T&{children:K}>|Tag, // , Child[]
    second?:T|K|Child,
    third?:K|Child
  ): View {
    let props: T
    let children: Child

    if (typeof second === 'object' && !isArray(second)) {
      children = third || [];
      props = ((second ?? {}) as T&{children:K})
    } else {
      children = (second as Child) || []
      props = {} as T&{children:K}
    }

    let ret:View

    if ((element as Component<T>).call) {
      let e:any
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
      e = sample(()=>(element as Component<T&{children:K}>)(props as T&{children:K}))
      ret = () => e
    } else {
      const tag = parseTag(element as Tag)
      const multiExpression = detectMultiExpression(children) ? null : undefined
      const e = r.element(tag.name)
      const props2 = props as T
      if (tag.id) e.setAttribute('id',tag.id)
      if (tag.classes?.length) {
        const cd = Object.getOwnPropertyDescriptor(props2,'class') ?? ({value:'',writable:true,enumerable:true} as any);
        (props2 as any).class = (!cd.value.call) ?
          [...tag.classes,...cd.value.split(' ')].filter(c=>c).join(' ') :
          () => [...tag.classes,...cd.value().split(' ')].filter(c=>c).join(' ')
      }
      if (patch) patch(props2)
      let dynamic = false
      const d = Object.getOwnPropertyDescriptors(props2)
      for (const k in d) {
        if (k !== "ref" && !k.startsWith('on') && d[k].value?.call) {
          dynamicProperty(props2 as any, k)
          dynamic = true
        } else if (d[k].get) dynamic = true
      }
      (dynamic ? r.spread : r.assign) (e, props2, !!(children as Child[])?.length)
      item(e,children as any,multiExpression)
      ret = () => e
    }
    ret[ELEMENT] = true
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
function parseTag(s:string):{name:string,id?:string,classes:string[]} {
  const classes:string[] = [];
  let name:string, id = undefined, i:number

  i = s.indexOf('#')
  if (i===-1) i = s.indexOf('.')
  if (i===-1) i = s.length
  name = s.slice(0, i) || 'div'
  s = s.slice(i)

  if (s[0]==='#') {
    i = s.indexOf('.')
    if (i===-1) i = s.length
    id = s.slice(1, i)
    s = s.slice(i)
  }

  while(s[0]==='.') {
    i = s.indexOf('.',1)
    if (i===-1) i = s.length
    classes.push(s.slice(1, i))
    s = s.slice(i)
  }
  return {name:name as string,classes,id:id}
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
