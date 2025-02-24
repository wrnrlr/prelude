import {assertEquals,assert} from '@std/assert'
import {describe,it} from '@std/testing/bdd'

import {signal,effect,untrack,batch,memo,context,useContext,root,wrap,fuse} from '../src/reactive.ts'

describe('signal', () => {
  const a = signal(1)
  assertEquals(a(),1)
  assertEquals(a(a()+1),2)
  assertEquals(a(i=>i+1),3)
  assertEquals(a('Hi'),'Hi')
  assertEquals(a(NaN),NaN)
  assertEquals(a(null),null)
})

describe('fuse', () => {
  const n = signal(1)
  const odd = signal(false)
  const c = fuse(n, i => (odd(i%2===0), n(i)))
  assertEquals(c(),1)
  assertEquals(c(2),2)
  assertEquals(odd(),true)
  assertEquals(c(i=>i+1),3)
  assertEquals(odd(),false)
})

describe('signal with equals option', () => {
  const n = signal(0,{equals:false})
  let m = 0
  effect(() => m += 1 + n() )
  assertEquals(m,1)
  assertEquals(n(0),0)
  assertEquals(m,2)
})

describe('effect', () => {
  const n = signal(1)
  let m = 0
  // effect(initial => m = n() + initial,1)
  effect(() => m = n() + 1)
  assertEquals(m,2)
  n(2)
  assertEquals(m,3)
})

describe('untrack',()=>{
  const n = signal(1)
  let m = 0
  effect(()=>m = untrack(n))
  assertEquals(m,1)
  n(2)
  assertEquals(m,1)
})

describe('computed',()=>{
  const a = signal(1),
    b = signal(10),
    c = ()=>a()+b()
  assertEquals(c(),11)
  a(2)
  assertEquals(c(),12)
  b(20)
  assertEquals(c(),22)
  let i = 0
  effect(()=>{c(); i++})
  batch(()=>{a(v => v++); b(v=>v++)})
})

describe('batch', () => {
  const  a = signal(1), b = signal(1)
  let i = 0
  effect(()=>{a(); b(); i++})
  assertEquals(i,1)
  a(2)
  b(2)
  assertEquals(i,3)
  batch(()=>{a(1); b(1)})
  it('batches changes', () => assertEquals(i,4))
})

describe('memo',{skip:true},() => {
  describe('memo with initial value',() => {})
})

describe('wrap', ()=>{
  describe('wrap singal of array', () => {
    const all = signal(['a','b']), first = wrap(all,0)
    assertEquals(first(),'a')
    assertEquals(first('A'),'A')
    assertEquals(first(),'A')
  })

  describe('wrap singal of object', () => {
    const all = signal({name:'a'}), name = wrap(all,'name')
    assertEquals(name(),'a')
    assertEquals(name('A'),'A')
    assertEquals(name(),'A')
    assertEquals(all(),{name:'A'})
  })

  describe('wrap singal of array of objects', () => {
    const all = signal([{name:'a'}]), first = wrap(all,0), name = wrap(first,'name')
    assertEquals(first({name:'b'}),{name:'b'})
    assertEquals(first(),{name:'b'})
    assertEquals(name(),'b')
    assertEquals(name('A'),'A')
    assertEquals(name(),'A')
    assertEquals(all(),[{name:'A'}])
  })

  describe('wrap singal of object with arrays', () => {
    const all = signal({ids:[0,1,2]}), ids = wrap(all,'id'), last = wrap(ids,-1)
    assertEquals(ids([1,2,3]),[1,2,3])
    assertEquals(ids(),[1,2,3])
    assertEquals(last(),3)
    assertEquals(last(4),4)
    assertEquals(last(),4)
  })

  describe('wrap singal of array of objects with array', () => {
    const all = signal([{ids:[0,1,2]}]), first = wrap(all,0), ids = wrap(first,'ids'), last = wrap(ids,-1)
    assertEquals(ids([1,2,3]),[1,2,3])
    assertEquals(last(4),4)
    assertEquals(all(),[{ids:[1,2,4]}])
  })

  describe('wrap singal of object with array of objects', () => {
    const obj = signal({todos:[{done:false,name:'a'}, {done:false,name:'b'}]}), todos = wrap(obj, 'todos'), todo = wrap(todos, 0),
      name = wrap(todo, 'name'), done = wrap(todo,'done')
    assertEquals(done(true),true)
    effect(()=>{
      name();done()
    })
    assertEquals(obj(),{todos:[{done:true,name:'a'},{done:false,name:'b'}]})
  })
})
