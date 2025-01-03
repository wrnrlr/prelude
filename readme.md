# Prelude
[Home](https://wrnrlr.github.io/prelude/) [NPM](https://www.npmjs.com/package/@wrnrlr/prelude) [JSR](https://jsr.io/@wrnrlr/prelude)

Prelude lets you develop web applications in a familiar component-based functional style.
It is build with the desire to have a lightweight frontend framework that works
using just JavaScript but that nontheless can handle complex web applications without
sacrificing on developer expierence.

## Get Started

Prelude works with most popular JavaScript runtimes: Node, Deno, Bun or the borwser.
It is available on NPM and JSR under the package named `@wrnrlr/prelude`.

The quickest way to get started with Prelude is uing the [Playground](https://wrnrlr.github.io/prelude/playground) app on the homepage.
It offers a IDE complete with a code editor, live preview and a number of examples.
Aternativaly you can develop on your local machine using `vite`.

Some Prelude APIs can also be used in the REPL to expore their behaviour interactively.

## Basic Example

This is a example of a button that increments a counter when it is clicked.

```html
<!DOCTYPE html>
<title>Counter</title>

<script type="module">
  import {h, signal, render} from 'https://esm.sh/@wrnrlr/prelude'

  function Counter() {
    const n = signal(1)
    return h('button', {onClick: e => n(n=>n+1)}, n)
  }

  render(Counter, document.body)
</script>
```

## Hyperscript

Prelude does not use JSX or a templating language to descript html instead we use a DSL called HyperScript.

The `h` function is used in either of two ways based on the type of the first argument,
when it is a string it will create a html element like ,
and when it is a function it will create a reactive component.

```js
h('div',{},[
  h('label','Name'),h('input',{})
])
```

### Event Handler

Prelude tries to integrate with the existing web APIs as much as possible, handeling user events is no different,
use a function to the event callback.

In the following example we listen for `onclick` events for a button, and increment the value of the `n` signal.

```js
h('button', {onClick:e => n(i => i + 1)}, n)
```

Be adviced, the event handler MUST always have one argument even if this is not being used, lest HyperScript confuses it for a signal
and ignores the events.

```js
// Ok
h('button', {onClick: e => console.log('Ok')})
h('button', {onClick: _ => console.log('Ok')})
// This event handler will be ignored
h('button', {onClick: () => console.log('Wrong')})
```

## Reactivity

### Signals

A signal is an object that holds a value with a setter to update this value and a getter that returns this value whenever it is updated.

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

### Effects

The `effect` function lets you subscribe to signals and perform side-effects whenever the signal chages.

```js
const a = signal(1), b = signal(2)
effect(() => console.log('a+b', a()+b()))
const c = () => a()+b()
effect(() => console.log('c', c()))
a(i => i+1)
```

### Memo

The `memo` function caches the result of the function passed to it.

```js
const n2 = memo(() => n() * 2)
```

### Untrack

## Conditional Rendering

```js
h(Show, {when:() => n()%2 === 0, fallback:'odd'}, 'even')
```

It is also possible to conditionally render a component by prefixing it with a JavaScript *and-expression*, like in the example below,
but using `Show` is going to be faster.

```js
h('',show&&'Hi')
```

## Rendering Lists

```js
h(List, {each:['a','b','c']}, (v,i)=>`${i()}:${v()}`)
```

## Fetching Resources

The `resource()` function lets you define a asynchronous signal.


```js
resource(async ()=>getPosts())
```

## Dependency Injection
Prelude supports dependency injection with the `contect` and `useContext` APIs.

```js
const CounterCtx = context()
const useCounter = () => useContext(CounterCtx)

function CounterProvider(props) {
  const count = signal(0)
  const increment = () => count(i=>i+1)
  return h(CounterCtx.Provider, {value:[count,increment]}, props.children)
}

function Counter() {
  const [n, increment] = useCounter()
  return h('button', {onClick:e=>increment()}, n)
}

function

function App() {
  h(CounterProvider, h(Counter))
}
```

## Router

```js
h(Router,[
  {path:'/', component:Posts},
  {path:'/user', component:Users}
])
```

## Developer Information

Start Development server

```sh
deno task dev
```

Run tests

```sh
deno task test
```

## Learn More

* [API Reference]()
* [SolidJS Docs]():
  The documentation of SolidJS also a good place for background information because Prelude is lacking extensive documentation at this time.
  Prelude started as a SolidJS clone, but with better HyperScript support. A lot of the concepts are the same but naming conventions can vary.

## TODO

* [ ] tailwind styling
* SSR
* Hydration
* Components
  * [ ] Select
  * [ ] Multiselect
  * [ ] DataTable
  * [ ] Dropdown
  * [ ] Dialog
  * [ ] Dynamic

## Links

* [Homepage](https://wrnrlr.github.io/prelude)
* [NPM](https://www.npmjs.com/package/@wrnrlr/prelude)
* [JSR](https://jsr.io/@wrnrlr/prelude)
