import {effect,sample} from './signal.ts'
const $ELEMENT = Symbol("hyper-element"), Fragment = (props) => props.children, {isArray} = Array;

export function hyperscript(r, patch) {
  const window = r.window

  function item(element,children,multiExpression) {
    if (children===null) return
    if (isArray(children)) for (const child of children) item(element, child, multiExpression)
    else if (children instanceof window.Element) r.insert(element, children, multiExpression)
    else if (typeof children==='string') element.appendChild(r.text(children))
    else if (children.call) {
      while ((children)[$ELEMENT]) children = (children)()
      r.insert(element, children, multiExpression)
    } else element.appendChild(r.text(children.toString()))
  }

  return function (element,props,rest) {
    if (element[$ELEMENT]) {
      rest = element
      element = Fragment
      console.log('-> fragment',element,props,rest)
    } else if (isArray(props) || typeof props==='string') {
      rest = props
      props = {}
      console.log('-> no props',element,props,rest)
    } else {
      rest = rest || []
      console.log('-> props',element,props,rest)
    }

    let ret;

    if (element.call) {
      ret = () => {
        console.log('~~>',element,props,rest)
        const d = Object.getOwnPropertyDescriptors(props)
        if (rest) props.children = rest
        for (const k in d) {
          console.log('=> prop', k, d[k])
          if (isArray(d[k].value)) {
            const list = d[k].value
            props[k] = () => {
              for (let i = 0; i < list.length; i++) while (list[i][$ELEMENT]) list[i] = list[i]()
              return list
            }
            console.log('===> array dynamic props')
            dynamicProperty(props, k)
          } else if (d[k].value?.call && !d[k].value.length) { // ??
            console.log('===> basic dynamic props')
            dynamicProperty(props, k) // ??
          }
        }
        return sample(()=>element(props))
      }
    } else {
      const multiExpression = detectMultiExpression(arguments) ? null : undefined
      const tag = parseTag(element)
      ret = () => {
        const e = r.element(tag.name)
        console.log('-->',element,props,rest)
        if (tag.id) e.setAttribute('id',tag.id)
        if (tag.classes?.length) {
          const cd = Object.getOwnPropertyDescriptor(props,'class') ?? {value:'',writable:true,enumerable:true}
          props.class = !cd.value.call ? [...tag.classes,...cd.value.split(' ')].filter(c=>c).join(' ') :
            () => [...tag.classes,...cd.value().split(' ')].filter(c=>c).join(' ')
        }
        if (patch) patch(props)
        let dynamic = r.assign
        const d = Object.getOwnPropertyDescriptors(props)
        for (const k in d) {
          if (k !== "ref" && !k.startsWith('on') && d[k].value?.call) { // maybe d[k].call ??
            console.log('dynamic prop', k,d[k].value.toString())
            dynamicProperty(props, k)
            dynamic = r.spread
          } else if (d[k].get) dynamic = r.spread
        }
        dynamic(e, props, !!rest?.length)
        item(e,rest,multiExpression)
        return e
      }
    }
    ret[$ELEMENT] = true
    return ret
  }
}

function detectMultiExpression(list) {
  if (typeof list[0] === "string") return true
  for (const i of list) {
    if (typeof i === "function") return true
    else if (isArray(i)) return detectMultiExpression(i)
  }
  return false
}

// ^([a-zA-Z]\w*)?(#[a-zA-Z][-\w]*)?(.[a-zA-Z][-\w]*)*
function parseTag(tag) {
  const classes = [];
  let name, id
  const m = tag.split(/([\.#]?[^\s#.]+)/)
  if (/^\.|#/.test(m[1])) name = 'div'
  for (const v of m) {
    if (!v) continue
    if (!name) name = v
    else if (v[0] === ".") classes.push(v.slice(1))
    else if (v[0] === "#") id = v.slice(1)
  }
  return {name,classes,id}
}

function dynamicProperty(props, key) {
  const src = props[key];
  Object.defineProperty(props, key, {
    get() { return src(); },
    enumerable: true
  });
  return props;
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
