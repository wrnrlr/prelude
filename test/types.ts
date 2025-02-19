import { runtime } from '../src/runtime.ts'
import { hyperscript, type Mountable } from '../src/hyperscript.ts'
import { signal, root } from '../src/reactive.ts'
import { List } from '../src/controlflow.ts'
import { Window } from 'happy-dom'

const window = new Window
const r = runtime(window as any), h = hyperscript(r)

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
