import { type Mountable } from '../src/runtime.ts'
import { h } from '../src/hyperscript.ts'
import { signal, root } from '../src/reactive.ts'
import { List } from '../src/list.ts'
import { Window } from 'happy-dom'

const window = new Window

globalThis.window = (window as any)
globalThis.document = (window as any).document
globalThis.navigator = (window as any).navigator


h('hr')
h('div', ['hello'])
h('', {class:''})

function CompReturningString() { return 'hi' }
function CompReturningNumber() { return 0 }
function CompReturningEmptyFragment() { return [] }
function CompReturningFragment() { return [h(CompReturningString), h(CompReturningNumber), '', 1] }

h(CompReturningString)
h(CompReturningNumber)
h(CompReturningEmptyFragment)
h(CompReturningFragment)

function CompWithProps(props: {a: string}) { return 'hi' }

h(CompWithProps, {a:''})

function CompWithChildren(props: {children:Mountable}) { return 'hi' }

h(CompWithChildren, [])
h(CompWithChildren, {}, [])
h(CompWithChildren, {children:[]})


function CompWithOptionalChildren(props: {children?:string[]}) { return 'hi' }

h(CompWithOptionalChildren)
h(CompWithOptionalChildren, [])
h(CompWithOptionalChildren, {})
h(CompWithOptionalChildren, {children:[]})

const booleans = signal([true, true, false])

// h(List, {each:()=>booleans}, (b, _i) => b)
