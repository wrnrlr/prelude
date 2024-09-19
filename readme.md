# PreludeJS

## Get Started

Run directly in the browser using ESM
   ```js
  import {h, signal, render} from 'https://esm.sh/@wrnrlr/prelude'
  ```

Install from NPM to run with Node or Bun
   ```js
  import {h, signal, render} from 'wrnrlr/prelude'
  ```

Use Deno's JSR
   ```js
  import {h, signal, render} from 'jsr:wrnrlr/prelude'
  ```

A simple js frontend library

```js
import {h,signal,render} from 'https://jsr.org/wrnrlr/prelude.ts'

function Counter() {
  const n = signal(1)
  return [n,h('button',{onclick(e){n(n=>n+1)}},'+')]
}

render(Counter, document.body)
```

## Signals

```js
const a = signal(1)
const b = signal(2)
effect(() => console.log('a+b', a()+b()))
const c = () => a()+b()
effect(() => console.log('c', c()))
a(i => i+1)
```

## Hyperscript

The `h` function allows one to write html in javascript with a DSL specifically designed

```js
h('div',{},[
  h('label','Name'),h('input',{})
])
```

## Event Handler

An event handler MUST have an argument even if this is not being used,
otherwise hyperscript will confuse it for a signal.

```js
// Ok
h('button', {onClick: e => console.log('Ok')}, 'Hi')
h('button', {onClick: _ => console.log('Ok')}, 'Hi')
// This event handler will be ignored
h('button', {onClick: () => console.log('Wrong')}, '')
```

## Conditional Rendering

```js
h(Show, {when:show}, 'Hi')
```

## Rendering Lists

```js
h(List, {each:show}, 'Hi')
```

## Inversion of Control
Prelude supports dependency injection with the `contect` and `useContext` APIs.

## Advanced DataTable

```js
h(Table)
```
