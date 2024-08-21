import {signal,effect,sample} from './signal.ts'
import {runtime} from './runtime.js'
import {hyperscript} from './hyperscript.js'

const r = runtime(window), h = hyperscript(r), render = r.render

const nbsp = '\u00A0'

function onMount(fn: () => void) {
  effect(() => sample(fn));
}

export {signal,effect,sample,h,render,runtime,hyperscript,onMount,nbsp}
