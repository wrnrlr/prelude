/*
MIT License

Copyright (c) 2016-2025 Ryan Carniato

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
// @ts-nocheck:
import {signal,effect,untrack,memo,batch,onCleanup} from './reactive.ts'

const NO_INIT = {}

/**
`resource`
*/
export function resource(pSource,pFetcher,pOptions) {
  let source
  let fetcher
  let options

  if ((arguments.length === 2 && typeof pFetcher === 'object') || arguments.length === 1) {
    source = true
    fetcher = pSource
    options = (pFetcher || {})
  } else {
    source = pSource
    fetcher = pFetcher
    options = pOptions || {}
  }

  let pr = null,
    initP = NO_INIT,
    scheduled = false,
    resolved = 'initialValue' in options
  const dynamic = source.call && memo(source)

  const contexts = new Set(),
    value = signal(options.initialValue),
    error = signal(undefined),
    track = signal(undefined, {equals: false}),
    state = signal(resolved ? 'ready' : 'unresolved')

  function loadEnd(p, v, error, key) {
    if (pr === p) {
      pr = null
      key !== undefined && (resolved = true)
      initP = NO_INIT
      completeLoad(v, error)
    }
    return v
  }

  function completeLoad(v, err) {
    batch(() => {
      if (err === undefined) value(() => v)
      state(err !== undefined ? 'errored' : resolved ? 'ready' : 'unresolved')
      error(err)
      for (const c of contexts.keys()) c.decrement()
      contexts.clear()
    }, false)
  }

  function read(...a) {
    const v = a.length===0 ? value() : value(a[0])
    const err = error();
    if (err !== undefined && !pr) throw err;
    return v;
  }

  function load(refetching = true) {
    if (refetching !== false && scheduled) return;
    scheduled = false;
    const lookup = dynamic ? dynamic() : (source);

    if (lookup == null || lookup === false) {
      loadEnd(pr, untrack(value));
      return;
    }
    const p = initP !== NO_INIT ? (initP)
      : untrack(() => fetcher(lookup, {value: value(), refetching}))

    if (!isPromise(p)) {
      loadEnd(pr, p, undefined, lookup);
      return p
    }
    pr = p;

    if ('value' in p) {
      if ((p).status === "success") loadEnd(pr, p.value, undefined, lookup);
      else loadEnd(pr, undefined, undefined, lookup);
      return p;
    }

    scheduled = true
    queueMicrotask(() => (scheduled = false));
    batch(() => {
      state(resolved ? 'refreshing' : 'pending')
      track()
    }, false);
    return p.then(
      v => loadEnd(p, v, undefined, lookup),
      e => loadEnd(p, undefined, castError(e), lookup)
    );
  }

  Object.defineProperties(read, {
    state: { get: () => state() },
    error: { get: () => error() },
    loading: {
      get() {
        const s = state();
        return s === 'pending' || s === 'refreshing';
      }
    },
    latest: {
      get() {
        if (!resolved) return read();
        const err = error();
        if (err && !pr) throw err;
        return value();
      }
    }
  })

  if (dynamic) effect(() => load(false));
  else load(false);

  return read
}


 function isPromise(v) {
   return v && typeof v === 'object' && 'then' in v
 }

 /**
Creates and handles an AbortSignal**
```ts
const [signal, abort, filterAbortError] =  makeAbortable({ timeout: 10000 });
const fetcher = (url) => fetch(url, {signal:signal()}).catch(filterAbortError); // filters abort errors
```
Returns an accessor for the signal and the abort callback.

Options are optional and include:
- `timeout`: time in Milliseconds after which the fetcher aborts automatically
- `noAutoAbort`: can be set to true to make a new source not automatically abort a previous request
*/
 export function makeAbortable(options) {
   let controller, timeout
   const abort = (reason) => {
     timeout && clearTimeout(timeout);
     controller?.abort(reason);
   }
   const signal = () => {
     if (!options.noAutoAbort && controller?.signal.aborted === false) abort("retry");
     controller = new AbortController();
     if (options.timeout) timeout = setTimeout(() => abort("timeout"), options.timeout)
     return controller.signal;
   }
   const error = err => {
     if (err.name === "AbortError") return undefined
     throw err;
   }
   return [signal, abort, error]
 }

 /**
Creates and handles an AbortSignal with automated cleanup
```ts
const [signal, abort, filterAbortError] =
  createAbortable();
const fetcher = (url) => fetch(url, { signal: signal() })
  .catch(filterAbortError); // filters abort errors
```
Returns an accessor for the signal and the abort callback.

Options are optional and include:
- `timeout`: time in Milliseconds after which the fetcher aborts automatically
- `noAutoAbort`: can be set to true to make a new source not automatically abort a previous request
*/

 export function abortable(options) {
   const [signal, abort, filterAbortError] = makeAbortable(options);
   onCleanup(abort);
   return [signal, abort, filterAbortError];
 }

 function castError(err) {
   if (err instanceof Error) return err;
   return new Error(typeof err === "string" ? err : "Unknown error", { cause: err });
 }
