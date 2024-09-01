import {assertEquals,assert} from '@std/assert'
import {describe,it} from '@std/testing/bdd'

import {signal,computed,effect,sample,batch} from '../src/mod.ts'

describe('signal',()=>{
  const a = signal(1)
  assertEquals(a(),1)
  describe('peek()',()=>assertEquals(a.peek(),1))
  describe('valueOf()',()=>assertEquals(a.valueOf(),1))
  describe('toJSON()',()=>assertEquals(a.toJSON(),1))
  describe('toString()',()=>assertEquals(a.toString(),'1'))
  assertEquals(a(a()+1),2)
  assertEquals(a(i=>i+1),3)
  assertEquals(a('Hi'),'Hi')
  assertEquals(a(NaN),NaN)
  assertEquals(a(null),null)
})

describe('effect',()=>{
  const n = signal(1)
  let m = 0
  effect(initial => m = n() + initial,1)
  assertEquals(m,2)
  n(2)
  assertEquals(m,4)
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
    c = computed(()=>a()+b())
  assertEquals(c(),11)
  describe('peek()',()=>assertEquals(c.peek(),11))
  describe('valueOf()',()=>assertEquals(c.valueOf(),11))
  describe('toJSON()',()=>assertEquals(c.toJSON(),11))
  describe('toString()',()=>assertEquals(c.toString(),'11'))
  a(2)
  assertEquals(c(),12)
  b(20)
  assertEquals(c(),22)
  let i = 0
  effect(()=>{c(); i++})
  batch(()=>{a(v => v++); b(v=>v++)})
})

describe('batch',()=>{
  const  a = signal(), b = signal()
  let i = 0
  effect(()=>{a(); b(); i++})
  assertEquals(i,1)
  batch(()=>{a(v=>v++); b(v=>v++)})
  assertEquals(i,2)
})
