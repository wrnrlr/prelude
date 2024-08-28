# PreludeJS

[ESM]() [Api]() [Examples]()

A simple js frontend library

```js
import {h,signal,render} from 'https://jsr.org/wrnrlr/prelude.ts'

function Counter() {
  const n = signal(1)
  return [n,h('button',{onclick(e){n(n=>n+1)}},'+')]
}

render(Counter)
```

## Signals

```js
const a = signal(1)
const b = signal(2)
effect(()=>console.log('a+b',a()+b()))
const c = computable(()=>a()+b())
effect(()=>console.log('c',c()))
a(i=>i+1)
```

## Hyperscript

```js
h('div',{},[
  h('label','Name'),h('input',{})
])
```

## Event Handler

A event handler MUST have an argument even if this is not used, this is to prevent hyperscript from confusing it with a signal.

```js
function Button(props) {
  const onClick = e => props.value(i=>i+1)
  return h('button',{onClick},props.value)
}
```

## Get Started

```js
// Deno JSR
import {h,signal,render} from '@jsr:wrnrlr/prelude.js'

// Browser
import {h,signal,render} from 'https://esm.sh/@wrnrlr/prelude.js'
```

## TypeScript Support

The PreludeJS API supports typescript

```ts
const n:Signal<number> = signal(0)
```

## Api

* Reactive primitives
  * `signal`
  * `effect`
  * `sample`
  * `computed`
  * `batch`
* Buildin Components
  * For
  * Show
  * ErrorBoundry
  * Suspend
  * Dialog
  * List
  * Table

## Status
  - [ ] Implement `For` component
  - [ ] Typescript support for `h()`
  - [ ] Tailwind like styling
  - [ ] Make computed signals implicit like in SolidJS

## Awesome Links

* [Patterns for Memory Efficient DOM Manipulation with Modern Vanilla JavaScript](https://frontendmasters.com/blog/patterns-for-memory-efficient-dom-manipulation/)
* [Two-way Binding is a Two-way Street](https://dev.to/this-is-learning/two-way-binding-is-a-two-way-street-2d3c)
* [React performance](https://blog.vjeux.com/2013/javascript/react-performance.html)
