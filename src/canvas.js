import {signal,effect,memo,context,useContext, onMount} from './reactive.ts'
import {$RUNTIME} from './runtime.ts'
import {h} from './mod.ts'

function CanvasRuntime() {
  let render,insert,spread,assign,element,text,isChild
  return {render,insert,spread,assign,element,text,isChild}
}

const CountCtx = context()

const useCount = () => useContext(CountCtx)

 function CountProvider(props) {
  const count = signal(0)
  return h(CountCtx, {value:[count]}, props.children)
}

const Ctx = context()
const useCanvas = () => useContext(Ctx)

function Canvas(props) {
  const canvas = signal()
  const ctx = signal()
  effect(() => ctx(canvas()?.getContext('2d')))
  return h(Ctx, {value:[canvas,ctx]},
    h('canvas', {ref:canvas}, props.children))
}

function toCanvas(fn) {
  // fn[$RUNTIME] = CanvasRuntime
  return fn
}

const Path = context()
const usePath = () => useContext(Path)

const Stroke = props => {
  const ref = signal()
  const [_,ctx] = useCanvas()
  const path = signal(null)
  let children
  onMount(()=>path(new Path2D()))
  effect(()=>console.log('Stroke',ref))
  effect(() => {
    if (!children) {
      children = signal()
    }
    const kids = children()
    if (kids) return
  })
  return h(Path, {ref, value:[path]}, props?.children)
}

const Fill = toCanvas(() => {
  const ctx = useCanvas()
})

const Line = props => {
  let value, path, path2d
  // if (props.value) value = memo(() => [l.x0, l.y0, l.x1, l.y1])
  if (props.children) value = props.children.call ? props.children : () => props.children
  if (props.fill || props.stroke) {
    path2d = new Path2D()
    // ctx =
  }
  if (!value) value = props.value
  let ctx = path2d ?? usePath()
  if (!path2d&&ctx) { path = ctx[0] }
  let render = path2d ?
    () => {
      path2d.moveTo(v[0],v[1])
      path2d.lineTo(v[2],v[3])
    } : () => {
      const p = path()
      p.moveTo(v[0],v[1])
      p.lineTo(v[2],v[3])
    }
  // effect(()=>console.log('Line',path(), value()))
  // effect(()=>{path().lineTo(...value())})
  return ops => {
    console.log('render line')
    // ops.push()
    return {
      shape() {return path2d},
      render,
      hit() {},
      size() {},
    }
  }
}

const Quadratic = toCanvas(q => {
  const path = usePath()
  return () => path.quadraticCurveTo(q.x0,q.y0,q.x1,q.y1,q.x2,q.y2)
})

const Bezier = toCanvas(b => {
  const path = usePath()
  return () => path.bezierCurveTo(b.x0,b.y0,b.x1,b.y1,b.x2,b.y2,b.x3,b.y3)
})

const Arc = toCanvas(a => {
  const path = usePath()
  return () => path.arc(a.x, a.y, a.radius, a.startAngle, a.endAngle, a.counterclockwise)
})

export const Group = {}
export const Pattern = {}
export const Text = {}
export const Rectangle = {}
export const Image = {}

export {CanvasRuntime,Canvas,Stroke,Fill,Line,Quadratic,Bezier,Arc}
