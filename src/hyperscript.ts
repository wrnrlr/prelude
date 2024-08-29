import {sample} from './signal.ts'
import type {Props,Mountable} from './constants.ts'
import type {Runtime} from './runtime.ts'

const $ELEMENT = Symbol(), {isArray} = Array

export type HyperScript = { <T extends Props> (element:Component<T>|Tag|any[],props:T,rest:any[]):()=>Component<T> }
type Component<T extends Props> = {(props:T): Mountable, [$ELEMENT]?: boolean}
type Tag = string

const Fragment:Component<Props> = <T extends Props>(props:T):Mountable => (props as any).children

export function hyperscript(r:Runtime, patch?:any):HyperScript {
  const window = r.window

  function item<T extends Props>(element:Element|Element[]|Component<T>|Component<T>[],children:string|any[],multiExpression?:Node|null) {
    if (children===null) return
    if (isArray(children)) for (const child of children) item(element, child, multiExpression)
    else if ((children as unknown) instanceof (window as any).Element) r.insert(element, children, multiExpression)
    else if (typeof children==='string') (element as any).appendChild(r.text(children))
    else if ((children as any).call) {
      while ((children as any)[$ELEMENT]) children = (children as any)()
      r.insert(element, children, multiExpression)
    } else (element as any).appendChild(r.text((children as any).toString()))
  }

  function h<T extends Props>(element:Component<T>|Tag|any[],props:T|string|any[],rest:string|any[]):Component<T> {
    if ((element as Component<T>)[$ELEMENT]) {console.warn('-> fragment',element,props,rest)}
    if (isArray(props) || typeof props==='string') {
      rest = props || []
      props = {} as T
    } else {
      rest = rest || []
      props = props ?? {}
    }

    let ret:Component<T>;

    if ((element as any).call) {
      const d = Object.getOwnPropertyDescriptors(props)
      if (rest) (props as any).children = rest
      for (const k in d) {
        if (isArray(d[k].value)) {
          const list:any = (d[k] as any).value
            (props as any)[k] = () => {
            for (let i = 0; i < list.length; i++) while (list[i][$ELEMENT]) list[i] = list[i]()
            return list
          }
          dynamicProperty(props as any, k)
        } else if (d[k].value?.call && !d[k].value.length) { // ??
          dynamicProperty(props as any, k)
        }
      }
      ret = () => sample(()=>(element as any)(props))
    } else {
      const multiExpression = detectMultiExpression(arguments) ? null : undefined
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
      dynamic(e, props2, !!rest?.length)
      item(e,rest,multiExpression)
      ret = () => e
    }
    ret[$ELEMENT] = true
    return ret
  }

  return h as any
}

function detectMultiExpression(list:any):boolean {
  if (typeof list[0] === "string") return true
  for (const i of list) {
    if (typeof i === "function") return true
    else if (isArray(i)) return detectMultiExpression(i)
  }
  return false
}

// ^([a-zA-Z]\w*)?(#[a-zA-Z][-\w]*)?(.[a-zA-Z][-\w]*)*
function parseTag(tag:string):{name:string,id?:string,classes:string[]} {
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
