type Callback<T = void> = () => T
export type EqualsFunction<T> = (value: T, valueNext: T) => boolean
export type ErrorFunction = (error: unknown) => void
export type RootFunction<T> = (dispose: () => void) => T
export type UpdateFunction<T> = (value: T) => T

export type Getter<T> = { (): T }

export type Setter<T> = {
  (update: UpdateFunction<T>): T,
  (value: T): T
}

export type Context<T> = {
  id: symbol,
  defaultValue: T,
  get(): T,
  set(value: T): void
}

export type Options<T> = { equals?: false | EqualsFunction<T> }

let BATCH: Map<Signal<any>, any> | undefined
let OBSERVER: Observer | undefined
let TRACKING = false
const SYMBOL_ERRORS = Symbol()

class Signal<T = unknown> {
  public parent: Computation<T> | undefined
  public value: T
  private readonly equals: EqualsFunction<T>
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

  set = (value: UpdateFunction<T> | T): T => {
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
  public cleanups: Callback[] = []
  public contexts: Record<symbol, any> = {}
  public observers: Set<Observer> = new Set()
  public signals: Set<Signal> = new Set()

  dispose(): void {
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

  get<T>(id: symbol): T | undefined {
    if (id in this.contexts) {
      return this.contexts[id]
    } else {
      return this.parent?.get<T>(id)
    }
  }

  set<T>(id: symbol, value: T): void {
    this.contexts[id] = value
  }
}

class Root extends Observer {
  wrap<T>(fn: RootFunction<T>): T {
    const fnWithDispose = () => fn(this.dispose)
    return wrap(fnWithDispose, this, false)!
  }
}

class Computation<T = unknown> extends Observer {
  private readonly fn: Callback<T>
  private fresh: boolean = false
  public signal: Signal<T>
  public waiting: number = 0

  constructor(fn: Callback<T>, options?: Options<T>) {
    super()
    this.fn = fn
    this.signal = new Signal<T>(this.run(), options)
    this.signal.parent = this
  }

  private run = (): T => {
    this.dispose()
    this.parent?.observers.add(this)
    return wrap(this.fn, this, true)!
  }

  update(): void {
    this.waiting = 0
    this.fresh = false
    this.signal.set(this.run)
  }

  stale(change: 1 | -1, fresh: boolean): void {
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
 * Create a {@link Signal} of type `T` with initial `value`
 * @param value Initial value
 * @param options Signal options
 * @example Create new Signal
 * ```js
 * const n = signal(1)
 * ```
 * @example  Get current value
 * ```js
 * n()
 * ```
 * @example  Set value
 * ```js
 * n(3)
 ```
 * @group Reactive Primitive
 */
export function signal<T>(value:T, options?:Options<T>): Getter<T> & Setter<T> {
  const s = new Signal<T>(value,options)
  const f = Object.assign((...args:T[]) => args.length ? s.set(args[0]) as T : s.get() as T, s)
  return f as unknown as Getter<T> & Setter<T>
}

/**
 * @group Reactive Primitive
 */
export function effect(fn: Callback): void {
  new Computation(fn)
}

export function memo<T>(fn: Callback<T>, options?: Options<T>): Getter<T> {
  return new Computation(fn, options).signal.get
}

export function root<T>(fn: RootFunction<T>): T {
  return new Root().wrap(fn)
}

export function createContext<T>(): Context<T | undefined>;
export function createContext<T>(defaultValue: T): Context<T>;
export function createContext<T>(defaultValue?: T) {
  const id = Symbol ()
  const get = (): T | undefined => OBSERVER?.get ( id ) ?? defaultValue
  const set = ( value: T ): void => OBSERVER?.set ( id, value )
  return {id, defaultValue, get, set}
}

export function useContext<T>(context: Context<T>): T {
  return context.get()
}

export function getOwner(): Observer | undefined {
  return OBSERVER
}

export function runWithOwner<T>(observer: Observer|undefined, fn: ()=>T):T {
  const tracking = observer instanceof Computation
  return wrap(fn, observer, tracking)!
}

/**
 Execute the function `fn` only once. Implemented as an {@link effect} wrapping a {@link sample}.
 @group Reactive Primitive
 */
export function onMount(fn: () => void) {
  effect(() => sample(fn));
}

export function onCleanup(fn: Callback):void {
  OBSERVER?.cleanups.push(fn)
}

export function onError(fn: ErrorFunction):void {
  if ( !OBSERVER ) return
  OBSERVER.contexts[SYMBOL_ERRORS] ||= []
  OBSERVER.contexts[SYMBOL_ERRORS].push (fn)
}

/**
 *
 * @group Reactive Primitive
 */
export function batch<T>(fn: Callback<T>):T {
  if ( BATCH ) return fn ()
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

export function sample<T>(fn: Callback<T>):T {
  return wrap(fn, OBSERVER, false)!
}

function wrap<T>(fn: Callback<T>, observer: Observer | undefined, tracking: boolean ): T|undefined {
  const OBSERVER_PREV = OBSERVER;
  const TRACKING_PREV = TRACKING;
  OBSERVER = observer;
  TRACKING = tracking;
  try {
    return fn();
  } catch (error: unknown) {
    const fns = observer?.get<ErrorFunction[]>(SYMBOL_ERRORS)
    if (fns)
      for (const fn of fns) fn(error)
    else throw error
  } finally {
    OBSERVER = OBSERVER_PREV;
    TRACKING = TRACKING_PREV;
  }
}
