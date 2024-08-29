export {signal,effect,sample,batch,memo,onMount} from './signal.ts'
export {nbsp} from './constants.ts'
export {For} from './flow.ts'

import type {Signal,Effect,Computed} from './signal.ts'

export type {Signal,Effect,Computed}

import {runtime} from './runtime.ts'
import {hyperscript} from './hyperscript.ts'

const r = runtime(window as any)

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
@group
*/
const h = hyperscript(r), render = r.render

export {h,render}
