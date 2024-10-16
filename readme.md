# Prelude
[NPM]() [JSR]()

Prelude lets you develop web applications in a familiar component-based functional style.
It is build with the desire to have a lightweight frontend framework that works
using just JavaScript but that nontheless can handle complex web applications without
sacrificing on developer expierence.

## Get Started

Starting a new Prelude project is as easy as creating a html and opening it in your browser.
For a complex aplication you probably want to use some JavaScript runtime and bundler
Save the file below as `index.html`, start the `vite` dev server and open it in the browser.

```html
<!DOCTYPE html>
<title>Counter</title>

<script type="module">
import {h, signal, render} from 'https://esm.sh/wrnrlr/prelude'

function Counter() {
  const n = signal(1), onclick = _ => n(n=>n+1)
  return h('button', {onclick}, n)
}

render(Counter, document.body)
</script>
```

Prelude works with most popular JavaScript runtimes: Node, Deno and Bun.
It is available on NPM and JSR under the package named `@wrnrlr/prelude`.


## Counter Example

```js
import {h,signal,render} from 'https://jsr.org/wrnrlr/prelude.ts'

function Counter() {
  const n = signal(1)
  return [n, h('button', {onclick(e){n(n=>n+1)}}, '+')]
}

render(Counter, document.body)
```

## Hyperscript

The `h` function allows one to write html in javascript with a DSL specifically designed

In Prelude we don't use JSX or some templating language to descript html content,
instead we use a DSL called Hyperscript that can be written in JavaScript or TypeScript.

The `h` function is used in either of two ways based on the type of the first argument,
when it is a string it will create a html element like ,
and when it is a function it will create a reactive component.

```js
h('div',{},[
  h('label','Name'),h('input',{})
])
```

One of the great benefits of not needing extra tooling to programmatically write html is that
the `h` function can be used in the repl of a terminal or the console of a browser to expore its behaviour interactively.

## Event Handler

Prelude tries to integrate with the existing web APIs as much as possible, and handeling user events is no different,
just use a function as the event handler of a given event type.
The event handler MUST have one argument even if this is not being used, otherwise hyperscript will confuse it for a signal.

```js
// Ok
h('button', {onClick: e => console.log('Ok')})
h('button', {onClick: _ => console.log('Ok')})
// This event handler will be ignored
h('button', {onClick: () => console.log('Wrong')})
```

## Signals

A signal is an object that holds a value with a setter to update this value and a getter that returns this value whenever it is updated.
In Prelude it is the convention that the function call with one argument is the setter and the function call with no arguments is the getter.

Create signal.
```js
// Create a signal with value one
const n = signal(1)

// Get value from signal
n()

// Set value for signal
n(2)

// Set value with an update function
n(i=>i+1)

// Derived signal
const n2 = () => n() * 2
```


## Effects

```js
const a = signal(1), b = signal(2)
effect(() => console.log('a+b', a()+b()))
const c = () => a()+b()
effect(() => console.log('c', c()))
a(i => i+1)
```

## Memo

```js
const n2 = memo(() => n() * 2)
```

## Conditional Rendering

```js
h('',show&&'Hi')
```

```js
h(Show, {when:show}, 'Hi')
```

## Rendering Lists

```js
h(List, {each:['a','b','c']}, (v,i)=>`${i()}:${v()}`)
```

## Dependency Injection
Prelude supports dependency injection with the `contect` and `useContext` APIs.

##  Table

WIP

## Hydration

WIP

## TODO

* [ ] `resource()`
* [ ] tailwind styling
* [ ] routing
* [ ] Select
* [ ] Multiselect
* [ ] Table
* [ ] Dropdown
* [ ] Dialog
* [ ] Dynamic
