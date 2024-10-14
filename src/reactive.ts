
export interface EffectOptions {
  name?: string;
}

export interface MemoOptions<T> extends EffectOptions {
  equals?: false | ((prev: T, next: T) => boolean);
}

export type EffectFunction<Prev, Next extends Prev = Prev> = (v: Prev) => Next;

/** @internal */
export type Fn<T = void> = () => T
export type EqualsFn<T> = (value: T, valueNext: T) => boolean
export type ErrorFn = (error: unknown) => void
export type RootFn<T> = (dispose: () => void) => T
export type UpdateFn<T> = (value: T) => T

/**
Get value of type `T`
@see {@link Setter} {@link signal} {@link memo}
*/
export type Getter<T> = {
  (): T
}

/**
Set value of type `T`
@see {@link Getter} {@link signal}
*/
export type Setter<T> = {
  (update: UpdateFn<T>): T,
  (value: T): T
}

export type Context<T> = {
  id: symbol,
  defaultValue: T,
  get(): T,
  set(value: T): void
}

export type Options<T> = {
  equals?: false | EqualsFn<T>
}

export const $TRACK = Symbol("track")

let BATCH: Map<Signal<any>, any> | undefined
let OBSERVER: Observer | undefined
let TRACKING = false
const SYMBOL_ERRORS = Symbol()

// interface Node<T> {
//   parent: Node<T> | undefined
//   get():T
//   set(value:T):T
// }
// Root node
// class RNode extends Node {}
//
// // Computed value node
// class CNode {}
//
// // Value node
// class VNode {}

export class Signal<T = unknown> {
  public parent: Computation<T> | undefined
  public value: T
  private readonly equals: EqualsFn<T>
  public readonly observers: Set<Computation> = new Set ()

  constructor(value: T, {equals}: Options<T> = {}) {
    this.value = value
    this.equals = (equals === false) ? () => false : equals || Object.is
  }

  get = (): T => {
    if (TRACKING && OBSERVER instanceof Computation) {
      this.observers.add(OBSERVER)
      OBSERVER.signals.add(this as Signal)
    }
    if (this.parent?.waiting)
      this.parent.update()
    return this.value
  }

  set = (value: UpdateFn<T> | T): T => {
    const valueNext = (value instanceof Function) ? value(this.value) : value
    if (!this.equals(this.value, valueNext )) {
      if (BATCH) {
        BATCH.set(this, valueNext)
      } else {
        this.value = valueNext
        this.stale(1, true)
        this.stale(-1, true)
      }
    }
    return this.value;
  }

  stale = (change: 1 | -1, fresh: boolean): void => {
    for (const observer of this.observers)
      observer.stale(change, fresh)
  }
}

abstract class Observer {
  public parent: Observer | undefined = OBSERVER
  public cleanups: Fn[] = []
  public contexts: Record<symbol, any> = {}
  public observers: Set<Observer> = new Set()
  public signals: Set<Signal> = new Set()

  protected dispose = ():void => {
    for (const observer of this.observers)
      observer.dispose()

    for (const signal of this.signals)
      signal.observers.delete(this as unknown as Computation)

    for (const cleanup of this.cleanups)
      cleanup()

    this.cleanups = []
    this.contexts = {}
    this.observers = new Set()
    this.signals = new Set()
    this.parent?.observers.delete(this)
  }

  get = <T> (id: symbol): T | undefined => {
    if (id in this.contexts) {
      return this.contexts[id]
    } else {
      return this.parent?.get<T>(id)
    }
  }

  set = <T>(id: symbol, value: T): void => {
    this.contexts[id] = value
  }
}

class Root extends Observer {
  wrap<T>(fn: RootFn<T>): T {
    return observe(() => fn(this.dispose), this, false)!
  }
}

class Computation<T = unknown> extends Observer {
  private readonly fn: Fn<T>
  private fresh: boolean = false
  public signal: Signal<T>
  public waiting: number = 0

  constructor(fn: Fn<T>, options?: Options<T>) {
    super()
    this.fn = fn
    this.signal = new Signal<T>(this.run(), options)
    this.signal.parent = this
  }

  private run = (): T => {
    this.dispose()
    this.parent?.observers.add(this)
    return observe(this.fn, this, true)!
  }

  update = (): void => {
    this.waiting = 0
    this.fresh = false
    this.signal.set(this.run)
  }

  stale = (change: 1 | -1, fresh: boolean): void => {
    if (!this.waiting && change < 0) return
    if (!this.waiting && change > 0) this.signal.stale(1, false)

    this.waiting += change
    this.fresh ||= fresh

    if (!this.waiting) {
      this.waiting = 0
      if (this.fresh) this.update()
      this.signal.stale(-1, false)
    }
  }
}

/**
Create a {@link Signal} of type `T` with initial `value`
@param value Initial value
@param options Signal options
@example Create new Signal
```js
const n = signal(1)
```
@example Get current value
```js
n()
```
@example Set value
```js
n(3)
```
@group Reactive Primitive
 */
export function signal<T>(value:T, options?:Options<T>): Getter<T> & Setter<T> {
  const s = new Signal<T>(value,options)
  const f = Object.assign((...args:T[]) => args.length ? s.set(args[0]) as T : s.get() as T, s)
  return f as unknown as Getter<T> & Setter<T>
}

/**
@group Reactive Primitive
*/
export function effect(fn: Fn): void {
  new Computation(fn)
}

/**
Memo creates a readonly reactive value equal to the return value of the given function
and makes sure that function only gets executed when its dependencies change

```js
const a = signal(1), b = signal(2)
const sum = memo((prev) => a()*b() + prev, 0)
sum()
```

The memo function should not update other signals.

@param fn
@param options
@group Reactive Primitive
*/
// export function memo<T extends K, K = T>(
//   fn: EffectFunction<undefined | NoInfer<K>, T>
// ): Getter<T>;
// export function memo<T extends K, Init = T, K = T>(
//   fn: EffectFunction<Init | K, T>,
//   value: Init,
//   options?: MemoOptions<T>
// ): Getter<T>;
export function memo<T extends K, Init = T, K = T>(
  fn: Fn<T>,
  value?: Init,
  options?: Options<T>
): Getter<T> {
  return new Computation(fn, options).signal.get
}

/**

@param fn
@group Reactive Primitive
*/
export function root<T>(fn: RootFn<T>): T {
  return new Root().wrap(fn)
}

export function context<T>(): Context<T | undefined>;
export function context<T>(defaultValue: T): Context<T>;
export function context<T>(defaultValue?: T) {
  const id = Symbol()
  const get = (): T | undefined => OBSERVER?.get ( id ) ?? defaultValue
  const set = ( value: T ): void => OBSERVER?.set ( id, value )
  const s = {id, defaultValue, get, set}
  const f = Object.assign((props:any) => {
    set(props.value)
    return () => props.children.call ? props.children() : props.children
  }, s)
  return f as unknown as Context<T>
}

export function useContext<T>(context: Context<T>): T {
  return context.get()
}

export type S<T> = Getter<T> | Setter<T>

/**

@param s Signal
@param k
*/
export function wrap<T>(s:S<Array<T>>, k:number|(()=>number)): S<T>
export function wrap<T>(s:S<Record<string,T>>, k:string|(()=>string)): S<T>
export function wrap<T>(s:S<Array<T>>|S<Record<string,T>>, k:number|string|(()=>number)|(()=>string)): S<T> {
  const t = typeof k
  if (t === 'number') {
    return ((...a:T[]) => {
      const b = (s as Getter<Array<T>>)()
      return (a.length) ? (s as Setter<Array<T>>)((b as any).toSpliced(k as number, 1, a[0])).at(k as number) : b.at(k as number)
    }) as S<T>
  } else if (t === 'string') {
    return ((...a:T[]) => {
      const b = (s as Getter<Record<string,T>>)()
      return (a.length) ? (s as Setter<Record<string,T>>)({...b, [k as string]:a[0]})[k as string] : b[k as string]
    }) as S<T>
  } else if (t === 'function')
    return ((...a:T[]) => {
      const i = (k as ()=>string|number)(), c = typeof i
      if (c==='number') return a.length ? (s as Setter<Array<T>>)((old:any) => old.toSpliced(i, 1, a[0]))[i as number] : (s as Getter<Array<T>>)()[i as number]
        else if (c === 'string') return a.length ? (s as Setter<Record<string,T>>)((b) => ({...b, [i]:a[0]}))[i as string] : (s as Getter<Record<string,T>>)()[i]
      throw new Error('Cannot wrap signal')
    }) as S<T>
  throw new Error('Cannot wrap signal')
}

export function getOwner(): Observer | undefined {
  return OBSERVER
}

export function runWithOwner<T>(observer: Observer|undefined, fn: ()=>T):T {
  const tracking = observer instanceof Computation
  return observe(fn, observer, tracking)!
}

/**
 Execute the function `fn` only once. Implemented as an {@link effect} wrapping a {@link untrack}.
 @group Reactive Primitive
 */
export function onMount(fn: () => void) {
  effect(() => untrack(fn));
}

export function onCleanup(fn: Fn):void {
  OBSERVER?.cleanups.push(fn)
}

export function onError(fn: ErrorFn):void {
  if ( !OBSERVER ) return
  OBSERVER.contexts[SYMBOL_ERRORS] ||= []
  OBSERVER.contexts[SYMBOL_ERRORS].push (fn)
}

/**
 *
 * @group Reactive Primitive
 */
export function batch<T>(fn: Fn<T>):T {
  if (BATCH) return fn ()
  const batch = BATCH = new Map<Signal, any> ();
  try {
    return fn()
  } finally {
    BATCH = undefined;
    // Mark all signals as stale
    for (const signal of batch.keys()) signal.stale(1,false)
    // Updating values
    for (const [signal,value] of batch.entries()) signal.set(()=>value)
    // Mark all those signals as not stale, allowing observers to finally update themselves
    for (const signal of batch.keys()) signal.stale(-1,false)
  }
}

/**
Get the value of a signal without subscribing to future updates.

@param fn
@returns value returned from `fn`
@group Reactive Primitive
*/
export function untrack<T>(fn: ()=>T):T {
  return observe(fn, OBSERVER, false)!
}

export function resource() {

}

function observe<T>(fn: Fn<T>, observer: Observer | undefined, tracking: boolean ): T|undefined {
  const OBSERVER_PREV = OBSERVER;
  const TRACKING_PREV = TRACKING;
  OBSERVER = observer;
  TRACKING = tracking;
  try {
    return fn();
  } catch (error: unknown) {
    const fns = observer?.get<ErrorFn[]>(SYMBOL_ERRORS)
    if (fns)
      for (const fn of fns) fn(error)
    else throw error
  } finally {
    OBSERVER = OBSERVER_PREV;
    TRACKING = TRACKING_PREV;
  }
}
