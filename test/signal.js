import {assertEquals,assert} from '@std/assert'
import {describe,it} from '@std/testing/bdd'

import {signal,effect,sample,batch,memo,context} from '../src/signal.ts'
import {wrap} from '../src/flow.js'

describe('signal', () => {
  const a = signal(1)
  assertEquals(a(),1)
  assertEquals(a(a()+1),2)
  assertEquals(a(i=>i+1),3)
  assertEquals(a('Hi'),'Hi')
  assertEquals(a(NaN),NaN)
  assertEquals(a(null),null)
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

describe('sample',()=>{
  const n = signal(1)
  let m = 0
  effect(()=>m = sample(n))
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

describe('wrap',()=>{
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
  })

  describe('wrap singal of array of objects', () => {
    const all = signal([{name:'a'}]), first = wrap(all,0), name = wrap(first,'name')
    assertEquals(first({name:'b'}),{name:'b'})
    assertEquals(first(),{name:'b'})
    assertEquals(name(),'b')
    assertEquals(name('A'),'A')
    assertEquals(name(),'A')
  })

  describe('wrap singal of object of arrays', () => {
    const all = signal({ids:[0,1,2]}), ids = wrap(all,'id'), last = wrap(ids,-1)
    assertEquals(ids([1,2,3]),[1,2,3])
    assertEquals(ids(),[1,2,3])
    assertEquals(last(),3)
    assertEquals(last(4),4)
    assertEquals(last(),4)
  })
})
