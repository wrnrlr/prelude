const $ELEMENT = Symbol("hyper-element"), Fragment = (props) => props.children, {isArray} = Array;

// Inspired by https://github.com/ryansolid/dom-expressions/blob/main/packages/hyper-dom-expressions/src/index.ts
export function hyperscript(r, patch) {
  function item(l,e,multiExpression) {
    if (l===null) return
    const t = r.archetype(l)
    if (t==='string') e.appendChild(r.createTextNode(l))
    else if (t==='number'||t==='bigint'||t==='boolean'||t==='date'||t==='regexp'|t==='symbol') e.appendChild(r.createTextNode(l.toString()))
    else if (t==='array') for (const i of l) item(i,e,multiExpression)
    else if (t==='element') r.insert(e, l, multiExpression ? null : undefined)
    else if (t==='function') {
      while ((l)[$ELEMENT]) l = (l)()
      r.insert(e, l, multiExpression ? null : undefined)
    }
  }
  return function () {
    let args = [].slice.call(arguments)
    while (isArray(args[0])) args = args[0]
    if (args[0][$ELEMENT]) args.unshift(Fragment)
    const multiExpression = detectMultiExpression(args)
    const ret = () => {
      let tag, element, e, rest = [...args]
      const t1 = r.archetype(rest[0])
      if (t1==='function') element = rest.shift()
      else if (t1==='string') tag = parseTag(rest.shift())
      const idx = rest.findIndex(a=>r.archetype(a)==='object'), props = idx===-1 ? {} : rest.splice(idx,1)[0]
      if (tag) {
        e = r.createElement(tag.name)
        if (tag.id) e.setAttribute('id',tag.id)
        if (tag.classes?.length) {
          const cd = Object.getOwnPropertyDescriptor(props,'class') ?? {value:'',writable:true,enumerable:true}
          props.class = typeof cd.value !== 'function' ? [...tag.classes,...cd.value.split(' ')].filter(c=>c).join(' ') :
            () => [...tag.classes,...cd.value().split(' ')].filter(c=>c).join(' ')
        }
        if (patch) patch(props)
        let dynamic = false
        const d = Object.getOwnPropertyDescriptors(props)
        for (const k in d) {
          if (k !== "ref" && !k.startsWith('on') && typeof d[k].value === "function") {
            dynamicProperty(props, k)
            dynamic = true
          } else if (d[k].get) dynamic = true
        }
        dynamic ? r.spread(e, props, r.isSVG(e), !!rest.length) : r.assign(e, props, r.isSVG(e), !!rest.length)
        item(rest,e,multiExpression)
      } else if (element) {
        const d = Object.getOwnPropertyDescriptors(props)
        if (rest) props.children = rest
        for (const k in d) {
          if (isArray(d[k].value)) {
            const list = d[k].value
            props[k] = () => {
              for (let i = 0; i < list.length; i++) while (list[i][$ELEMENT]) list[i] = list[i]()
              return list
            }
            dynamicProperty(props, k)
          } else if (typeof d[k].value === "function" && !d[k].value.length) dynamicProperty(props, k)
        }
        e = r.createComponent(element, props)
      }
      return e
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

function tw(rules) {
  const classes = (classes) => classes.filter(c=>!rules.some(r=>c.match(r[0]))).join(' ')
  const styles = (classes) => classes.reduce((acc,c) => {
    for (const r of rules) {
      const m = c.match(r[0])
      if (m) acc.push(r[1](...m.splice(1)))
    }
    return acc
  },[]).join(';')
  return props => {
    if (!props.class) return
    const cd = Object.getOwnPropertyDescriptor(props,'class'), cf = typeof cd.value === 'function'
    props.class = cf ? ()=>classes(cd.value().split(' ')) : classes(cd.value.split(' '))
    if (!props.style) props.style = cf ? ()=>styles(cd.value().split(' ')) : styles(cd.value.split(' '))
    else {
      const sd = Object.getOwnPropertyDescriptor(props,'style'), sf = typeof sd.value === 'function'
      if (cf) props.style = sf ? ()=>styles(cd.value().split(' ')) + ';' + sd.value() : ()=>styles(cd.value().split(' ')) + ';' + sd.value
      else {
        const ca = styles(cd.value.split(' '))
        props.style = sf ? () => ca +  ';' + sd.value() : ca + ';' + sd.value
      }
    }
  }
}

const spacing = {p:'padding', m:'margin'}
const toDirection = {b:'bottom', l:'left', r:'right', t:'top'}
const toSurface = {bg:'background',text:'text',border:'border',outline:'outline'}
const alignContent = {start:'flex-start',center:'center',end:'flex-end',between:'space-between',around:'space-around',evenly:'space-evenly'}
const toColor = (name,weight) => 'red'

const rules = [
  // padding & margin
  [/([pm])-(\d+)/, (pm,size)=>`${spacing[pm]}:${size/4}rem`],
  // border
  // [/b-%d/, (width)=>({'border-size':width})]
  // bg & text & border & outline
  // [/(bg|text|border|outline)-\W+-\d+/, (style,color,weight)=>({[toSurface[style]]:toColor(color,weight)})],
  // display
  // [/(block|inline|inline-block|flex|inline-flex|none)/, (display)=>({display})],
  // [/items-(start|center|end|stretch|baseline)/, (pos)=>({'align-items':pos})],
  // [/justify-(start|center|end|stretch|baseline)/, (pos)=>({'justify-content':pos})],
  // [/content-(start|center|end|between|around|evenly)/, (pos)=>({'align-content':alignContent[pos]})],
  // [/self-(auto|start|center|end|stretch|baseline)/, (pos)=>({'aligh-self':pos})],
]
