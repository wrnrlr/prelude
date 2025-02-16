import {runtime} from '../src/runtime.ts'
import {hyperscript} from '../src/hyperscript.ts'
import {signal,root} from '../src/reactive.ts'
import { Window } from 'happy-dom'

const window = new Window
const r = runtime(window as any), h = hyperscript(r)

h('hr')
h('div', ['hello'])
h('', {class:''})

function CompReturningString() { return 'hi' }
function CompReturningNumber() { return 0 }
function CompReturningEmptyFragment() { return [] }
function CompReturningFragment() { return [h(CompReturningString), h(CompReturningNumber)] }

h(CompReturningString)
h(CompReturningNumber)
h(CompReturningEmptyFragment)
h(CompReturningFragment)

function CompWithProps(props: {a: string}) { return 'hi' }

h(CompWithProps, {a:''})

function CompWithChildren(props: {children:string[]}) { return 'hi' }

h(CompWithChildren, [])
h(CompWithChildren, {}, [])
h(CompWithChildren, {children:[]})


function CompWithOptionalChildren(props: {children?:string[]}) { return 'hi' }

h(CompWithOptionalChildren)
h(CompWithOptionalChildren, [])
h(CompWithOptionalChildren, {})
h(CompWithOptionalChildren, {children:[]})
