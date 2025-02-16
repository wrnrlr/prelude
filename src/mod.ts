// @ts-nocheck:
export type {Getter,Setter,Fn,EqualsFn,ErrorFn,RootFn,UpdateFn} from './reactive.ts'
export {signal,effect,untrack,batch,memo,root,wrap,fuse,onMount,onCleanup} from './reactive.ts'
export {nbsp} from './constants.ts'
export {Show,List} from './controlflow.ts'
export {runtime, type Runtime} from './runtime.ts'
import {runtime, type Runtime} from './runtime.ts'
export {hyperscript,type Child,type Tag,type View,type Component} from './hyperscript.ts'
import {hyperscript, parseHtmlTag} from './hyperscript.ts'
export {Router} from './router.js'
export {resource,makeAbortable,abortable} from './resource.js'

const r:Runtime = /*#__PURE__*/ (typeof window === 'object') ? runtime(window as any) : undefined as any

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
const h = /*#__PURE__*/ hyperscript(r, parseHtmlTag)

const render = /*#__PURE__*/ r?.render

// import {signal,wrap} from './reactive.ts'

// /**
// @group Utils
// */
// export function $(a:any,b:any):any {
//   const t = typeof a
//   if (t==='function') return wrap(a,b)
//   else return signal(a,b)
// }

export {h,render}
