// @ts-nocheck:
import type {DOMElements} from './constants.ts'
import type {Runtime} from './runtime.ts'

const ELEMENT: unique symbol = Symbol(), {isArray} = Array

export type Mountable = View[] | HTMLElement | Document | ShadowRoot | DocumentFragment | Node | string | number | bigint | symbol;
export type Component<T> = (props:T)  => Mountable
export type Tag = typeof DOMElements extends Set<infer K> ? K : never;
export type Child = { ():Child } | Element | Child[] | string | number | symbol | bigint | boolean | Record<string,unknown> | {():Child, [ELEMENT]:boolean}
export type View = {():void, [ELEMENT]?:boolean}

// export type PropsKeys = typeof Properties extends Set<infer K> ? K : never;
// export type BooleanProps = typeof BooleanAttributes extends Set<infer K> ? K : never;
// export type HandlerProps = typeof DelegatedEvents extends Set<infer K> ? K : never;
// export type ChildProps = {children?:any[]}
// export type ElementProps = BooleanProps & HandlerProps & ChildProps & {class: string}
// export type ComponentProps = { children?:Child }
// export type Props = Record<string, any>
// type AllProps = ElementProps | ComponentProps
// type EmptyProps = Record<string,never>
// const Fragment:Component<Props> = <T extends Props>(props:T):Mountable => (props as any).children

export type TagParser = <T extends string>(s:T) => {name:string,id?:string,classes:string[],namespace?:string}

/**
@param r
@param patch
@group Hyperscript
*/
export function hyperscript(r: Runtime, parseTag: TagParser = parseHtmlTag) {

  function item(e: Element, c: string, m?: null): void
  function item(e: Element, c: number, m?: null): void
  function item(e: Element, c: Element, m?: null): void
  function item(e: Element, c: Child, m?: null): void
  function item(e: Element, c: Child, m?: null): void {
    if (c===null) return
    const t = typeof c
    if (isArray(c))
      for (const child of c)
        item(e, child, m)
    else if (t === 'object' && r.isChild(c))
      r.insert(e, c, m)
    else if (t === 'string')
      e.appendChild(r.text((c as string)))
    else if (t === 'function') {
      // while (c[ELEMENT]?.call) c = (c as any)()
      r.insert(e, c, m)
    } else e.appendChild(r.text(c.toString()))
  }

  function h(first: Tag): View
  function h<P>(first: Tag, second: P): View
  function h<C extends Child>(first: Tag, second: C): View
  function h<C extends Child, P>(first: Tag, second: P, third: C): View

  function h(first: Component<Record<string,never>>): View
  function h<P extends Record<string, unknown>>(first: Component<P>, second: P): View
  function h<C extends Child>(first: Component<{children:C}>, second: C): View
  function h<P extends Record<string, unknown>, C extends Child>(first: Component<P & {children:C}>, second:P, third:C): View

  function h<P extends Record<string,unknown>, C extends Child>(
    first: Tag | Component<P>,
    second?: P | C,
    third?: C
  ): View {
    let props: P
    let children: Child

    const t1 = typeof first

    if (typeof second === 'object' && !isArray(second)) {
      children = (third as Child) || [];
      props = ((second ?? {}) as P & {children:C})
    } else {
      children = (second as Child) || []
      props = {} as P & {children:C}
    }

    let ret:View

    if (t1 === 'string') {
      const tag = parseTag(first as Tag)
      const multiExpression = detectMultiExpression(children) ? null : undefined
      const e = r.element(tag.name)
      const props2 = props as P
      if (tag.id) e.setAttribute('id',tag.id)
      if (tag.classes?.length) {
        const cd = Object.getOwnPropertyDescriptor(props2,'class') ?? ({value:'',writable:true,enumerable:true});
        (props2 as any).class = (cd.value?.call) ?
          () => [...tag.classes,...(cd.value()??'').split(' ')].filter(c=>c).join(' ') :
          [...tag.classes,...(cd.value??'').split(' ')].filter(c=>c).join(' ')
      }
      // if (patch) patch(props2)
      let dynamic = false
      const d = Object.getOwnPropertyDescriptors(props2)
      for (const k in d) {
        if (k !== 'ref' && !k.startsWith('on') && d[k].value?.call) {
          dynamicProperty(props2, k)
          dynamic = true
        } else if (d[k].get) dynamic = true
      }
      (dynamic ? r.spread : r.assign) (e, props2, !!(children as Child[])?.length)
      item(e, children, multiExpression)
      ret = () => e
    } else {
      const d = Object.getOwnPropertyDescriptors(props)
      if (children) (props as any).children = children
      for (const k in d) {
        if (isArray(d[k].value)) {
          const list = d[k].value;
          (props as any)[k] = () => {
            for (let i = 0; i < list.length; i++)
              while (list[i][ELEMENT]) list[i] = list[i]()
            return list
          }
          dynamicProperty(props, k)
        } else if (typeof d[k].value==='function' && !d[k].value.length) { // A function with zero arguments
          dynamicProperty(props, k)
        }
      }
      const e = r.component(() => (first as any)(props))
      ret = () => e
    }
    ret[ELEMENT] = true
    return ret
  }

  return h
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
export function parseHtmlTag(s:Tag) {
  const classes:string[] = [];
  let id:string|undefined = undefined, i:number

  i = s.indexOf('#')
  if (i===-1) i = s.indexOf('.')
  if (i===-1) i = s.length
  const name = s.slice(0, i) || 'div'
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
