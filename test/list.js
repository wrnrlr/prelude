import {assertEquals,assert} from '@std/assert'
import {describe,it} from '@std/testing/bdd'

import { signal } from '../src/reactive.ts'
import { listArray } from '../src/controlflow.ts'

// Deno.test('listArray applies list to mapFn', ()=>{
//   const l = signal([0,1,2])
//   const r = listArray(l, (e,i)=>({e:e(), i:i()}))
//   assertEquals(r(), [{e:0,i:0}, {e:1,i:1}, {e:2,i:2}])
// })

// Deno.test('listArray append element', ()=>{
//   const l = signal([0,1,2])
//   const r = listArray(l, (e,i)=>({e:e(), i:i()}))
//   assert(r(), [{e:0,i:0}, {e:1,i:1}, {e:2,i:2}])
//   l(l => [...l,3])
//   assertEquals(r(), [{e:0,i:0}, {e:1,i:1}, {e:2,i:2}, {e:3,i:3}])
// })

// Deno.test('listArray prepend element', ()=>{
//   const l = signal([0,1,2])
//   const r = listArray(l, (e,i)=>({e:e(), i:i()}))
//   r()
//   l(l => [3, ...l])
//   assertEquals(r(), [{e:3,i:0}, {e:0,i:1}, {e:1,i:2}, {e:2,i:3}])
// })
// const l1 = signal(['a'])
// const r1 = listArray(l1, (e,i)=>([i(),e()]))
// r1()
// l1(l => ['x', ...l])
// l1(l => [...l, 'x', 'y'])
// console.log(JSON.stringify(r1()))
// assertEquals(r(), )
