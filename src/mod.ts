export type {Getter,Setter,Fn,EqualsFn,ErrorFn,RootFn,UpdateFn} from './reactive.ts'
export {signal,effect,sample,batch,memo,root,onMount} from './reactive.ts'
export {nbsp} from './constants.ts'
export {wrap,Show,List} from './controlflow.js'
export {runtime, type Runtime} from './runtime.ts'
import {runtime, type Runtime} from './runtime.ts'
export {hyperscript,type HyperScript,type Child,type Props,type Tag,type View,type Component} from './hyperscript.ts'
import {type HyperScript, hyperscript} from './hyperscript.ts'
export {Input,Table} from './components.js'
export * from './canvas.js'

const r:Runtime = runtime(window as any)

/** h
@example Element with a single child
```js
h('h1','Hello World!')
```
@example Element with multiple children
```js
h('p',['Hello ',h('em','World!')])
```
@example Component with event handler
```js
h(Input,{onInput:e => {}})
```
@group Hyperscript
*/
const h:HyperScript = hyperscript(r)

const render = r.render

import {signal} from './reactive.ts'
import {wrap} from './controlflow.js'

/**
@group Utils
*/
export function $(a:any,b:any):any {
  const t = typeof a
  if (t==='function') return wrap(a,b)
  else return signal(a,b)
}

export {h,render}
