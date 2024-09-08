import {assertEquals,assert} from '@std/assert'
import {describe,it} from '@std/testing/bdd'

import {signal,effect,sample,batch} from '../src/signal2.ts'

describe('signal',()=>{
  const a = signal(1)
  assertEquals(a(),1)
  assertEquals(a(a()+1),2)
  assertEquals(a(i=>i+1),3)
  assertEquals(a('Hi'),'Hi')
  assertEquals(a(NaN),NaN)
  assertEquals(a(null),null)
})

describe('effect',()=>{
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

describe('batch',()=>{
  const  a = signal(1), b = signal(1)
  let i = 0
  effect(()=>{a(); b(); i++})
  assertEquals(i,1)
  batch(()=>{a(1); b(2)})
  assertEquals(i,2)
})
