import {sample} from './signal.ts'
import {Properties,BooleanAttributes,DelegatedEvents,DOMElements, type Mountable} from './constants.ts'
import type {Runtime} from './runtime.ts'

const $ELEMENT = Symbol(), {isArray} = Array

export type PropsKeys = typeof Properties extends Set<infer K> ? K : never;
export type BooleanProps = typeof BooleanAttributes extends Set<infer K> ? K : never;
export type HandlerProps = typeof DelegatedEvents extends Set<infer K> ? K : never;
export type ChildProps = {children?:any[]}
export type ElementProps = BooleanProps & HandlerProps & ChildProps
export type Props = ElementProps | Record<PropsKeys,any>

export type Child = Child[] | string | number | symbol | bigint | {():Child, [$ELEMENT]:boolean}

type View = {():void, [$ELEMENT]?:boolean}

type EmptyProps = Record<string,never>
export type HyperScript = {
  (element:Tag, props:ElementProps, children:Child): View
  (element:Tag, props:ElementProps): View
  (element:Tag, children:Child): View
  (element:Tag): View

  <T extends Props>(element:Component<T>, props?:T, children?:Child): View
  <T extends Props>(element:Component<T>, props?:T): View
  (element:Component<ChildProps>, children?:Child): View
  (element:Component<EmptyProps>): View
}

type Component<T extends Props> = {(props:T): Mountable, [$ELEMENT]?: boolean}
type Tag = typeof DOMElements extends Set<infer K> ? K : never;

const Fragment:Component<Props> = <T extends Props>(props:T):Mountable => (props as any).children

export function hyperscript(r:Runtime, patch?:any):HyperScript {
  const window = r.window

  function item<T extends Props>(
    element:Element|Element[]|Component<T>|Component<T>[],
    children:Child,
    multiExpression?:Node|null
  ) {
    if (children===null) return
    if (isArray(children)) for (const child of children) item(element, child, multiExpression)
    else if ((children as unknown) instanceof (window as any).Element) r.insert(element, children, multiExpression)
    else if (typeof children==='string') (element as Element).appendChild(r.text(children))
    else if ((children as ()=>Child).call) {
      while ((children as any)[$ELEMENT]) children = (children as {():Child})()
      r.insert(element, children, multiExpression)
    } else (element as Element).appendChild(r.text(children.toString()))
  }

  return function h<T extends Props>(
    element:Component<T>|Tag,
    props?:T|string|any[],
    children?:Child
  ): View {
    if ((element as Component<T>)[$ELEMENT]) {console.warn('-> fragment',element,props,children)}

    if (isArray(props) || typeof props==='string' || props?.call) {
      console.log(element,'props1',props)
      children = (props as string|any[]) || []
      props = {} as T
    } else {
      console.log(element,'props2',props)
      children = children || []
      props = (props as T) ?? {}
    }

    let ret:View

    if ((element as Component<T>).call) {
      ret = () => {
        const d = Object.getOwnPropertyDescriptors(props)
        if (children) {
          // console.log(props);
          (props as Props).children = children
        }
        for (const k in d) {
          if (isArray(d[k].value)) {
            const list:any = (d[k] as any).value;
            (props as any)[k] = () => {
              for (let i = 0; i < list.length; i++)
                while (list[i][$ELEMENT]) list[i] = list[i]()
              return list
            }
            dynamicProperty(props as any, k)
          } else if (d[k].value?.call && !d[k].value.length) { // ??
            dynamicProperty(props as any, k)
          }
        }
        return sample(()=>(element as Component<T>)(props))
      }
    } else {
      ret = () => {
        const multiExpression = detectMultiExpression(children) ? null : undefined
        const tag = parseTag(element as Tag)
        const e = r.element(tag.name)
        const props2 = props as any
        if (tag.id) e.setAttribute('id',tag.id)
        if (tag.classes?.length) {
          const cd = Object.getOwnPropertyDescriptor(props2,'class') ?? ({value:'',writable:true,enumerable:true} as any)
          props2.class = (!cd.value.call) ? [...tag.classes,...cd.value.split(' ')].filter(c=>c).join(' ') :
            () => [...tag.classes,...cd.value().split(' ')].filter(c=>c).join(' ')
        }
        if (patch) patch(props2)
        let dynamic = r.assign
        const d = Object.getOwnPropertyDescriptors(props2)
        for (const k in d) {
          if (k !== "ref" && !k.startsWith('on') && d[k].value?.call) { // maybe d[k].call ??
            dynamicProperty(props2, k)
            dynamic = r.spread
          } else if (d[k].get) dynamic = r.spread
        }
        dynamic(e, props2, !!(children as any)?.length)
        item(e,children,multiExpression)
        return e
      }
    }
    ret[$ELEMENT] = true
    return ret
  }
}

function detectMultiExpression(list:any):boolean {
  if (list.call) return true
  else if (!isArray(list)) return false
  for (const i of list) {
    if (i.call) return (console.log('multi'),true)
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
