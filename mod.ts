export {signal,effect,sample} from './signal.ts'
import {runtime} from './runtime.js'
import {hyperscript} from './hyperscript.js'

// export const root = S.root
// export const sample = S.sample
// export const effect = S
// export const signal = S.value

// import {Signal} from './s2.js'

// export class ValueSignal extends Signal {
//   constructor(_) {
//     super(_)
//     return new Proxy(this,{apply:(signal,_,args) => {
//       if (args.length===0) return signal.value
//     }})
//   }
// }

// export function signal2(value) {
//   const s = new Signal(value)
//   return new Proxy(s,{apply:(s,_,args)=>{}})
// }

const r = runtime(window), h = hyperscript(r), render = r.render

export {h,render,runtime,hyperscript}
