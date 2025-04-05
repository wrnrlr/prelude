export type {Getter,Setter,Signal} from './reactive.ts'
export {signal,effect,untrack,batch,memo,root,context,useContext,wrap,fuse,onMount,onCleanup} from './reactive.ts'
export {nbsp} from './constants.ts'
export {List} from './list.ts'
export {Show} from './show.ts'
export {r, type Runtime} from './runtime.ts'
export type * from './hyperscript.ts'
export {hyperscript, h} from './hyperscript.ts'
export {HashRouter} from './router.js'
export {resource,makeAbortable,abortable} from './resource.js'

// const r:Runtime = /*#__PURE__*/ (typeof window === 'object') ? runtime(window) : undefined as unknown as Runtime

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
// export const h: HyperScript = /*#__PURE__*/ hyperscript(r, parseHtmlTag)

/** render

Render component to DOM element.

```js
render(()=>'hi', document.body)
```
*/
// export const render:(code:()=>void, element:Element, init:unknown) => void = /*#__PURE__*/ r?.render
