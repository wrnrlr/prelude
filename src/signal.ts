/// Basic signal & effect library

export type Display<T> = {toJSON():T;valueOf():T,toString():string}
export type Getter<T> = {():T; peek():T}
export type Setter<T> = {(a:T):T; (a:(v:T)=>T):T}
export type Observable = { add(e:Observable):void; delete(e:Observable):void; dispose():void}

/**
* @group Types
*/
export type Effect<T> = Observable & {fn(v?:T):T}

/**
* @group Types
*/
export type Computed<T> = Observable & Getter<T> & Display<T>

/**
@see {@link signal}
@group Types
*/
export type Signal<T> = Computed<T> & Setter<T> & {get():T;set(a:T):T;} & Display<T>

/**
* Create a {@link Signal} of type `T` with initial `value`
* @param value Initial value
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
export function signal<T>(value:T):Signal<T> {
  const effects = new Set<Effect<T>>
  const self:any = {
    value,
    set(value:T) {
      if (self.value === value) return self.value
      self.value = typeof value==='function' ? value(self.get()) : value
      const root = !BATCHES;
      for (const effect of cleared(effects))
        if (root) effect.fn()
        else BATCHES?.add(effect)
      return self.value
    },
    get():T {
      if (EFFECT) EFFECT.add(self.add(EFFECT))
      return self.value as T
    },
    add: (e:Effect<T>) => effects.add(e),
    delete: (e:Effect<T>) => effects.delete(e),
    peek: () => self.value,
    valueOf: () => self.get(),
    toString: () => String(self.get()),
    toJSON: () => self.get(),
  }
  const f = Object.assign((...args:T[]) => args.length ? self.set(args[0] as any) as T : self.get() as T, self)
  return f as Signal<T>
}

/**
* @group Reactive Primitive
*/
export function computed<T>(fn:(v?:T)=>T, value?:T):Computed<T> {
  const self:any = {
    e: null,
    value: value,
    get: () => {
      if (!self.e) (self.e = create(()=>self.value=self.fn(self.value))).fn()
      return self.value
    },
    fn: fn,
    peek: () => self.value,
    valueOf: () => self.get(),
    toString: () => String(self.get()),
    toJSON: () => self.get(),
  }
  const f = Object.assign(self.get,self)
  return f as Computed<T>
}

/**
* @group Reactive Primitive
*/
export function effect<T extends void | undefined>(fn:(v?:T)=>T|undefined, value?:T):Effect<T> {
  let result:ReturnType<typeof fn>
  const fx = create(inital => { result = fn(inital); return result}, value)
  if (EFFECT) EFFECT.add(fx)
  fx.fn()
  const ret = () => {
    fx.dispose()
  }
  return ret as unknown as Effect<T>
}

function create<T>(fn:(v?:T)=>T|undefined,value?:T):Effect<T> {
  const e = effect2(() => {
    const prev = EFFECT
    EFFECT = e
    try { value = fn(value) }
    finally { EFFECT = prev }
    return value
  })
  return e
}

function effect2<T>(fn:(v?:T)=>T|undefined):Effect<T> {
  const effects = new Set<Effect<T>>
  const self = {
    effects,
    fn,
    add: (e:Effect<T>) => effects.add(e),
    delete: (e:Effect<T>) => effects.delete(e),
    dispose: () => {
      for (const entry of cleared(effects)) {
        entry.delete(self);
        entry.dispose?.();
      }
    }
  }
  return self as Effect<T>
}

/**
* @group Reactive Primitive
*/
export function sample<T>(fn:()=>T):T {
  const prev = EFFECT
  EFFECT = null
  const result =  fn()
  EFFECT = prev
  return result
}

/**
* @group Reactive Primitive
*/
export function batch(fn:()=>void):void {
  let effects = BATCHES
  if (!effects) BATCHES = new Set
  try { fn() }
  finally {
    if (!effects) {
      effects = BATCHES; BATCHES = null
      for (const effect of effects!) effect.fn()
    }
  }
}

/**
* @group Reactive Primitive
*/
export function memo<T>(fn:()=>T, equal:T):T {
//   if (typeof fn !== "function") return fn;
//   if (!equal) return effect(fn);
//   const s = signal(sample(fn));
//   effect(() => s(fn()));
//   return s;
  return null as T
}

let EFFECT:null|Effect<unknown> = null
let BATCHES:null|Set<Effect<unknown>> = null

function cleared(self:Set<Effect<unknown>>):Effect<unknown>[] {
  const entries = [...self];
  self.clear();
  return entries;
}

/**
Execute the function `fn` only once. Implemented as an {@link effect} wrapping a {@link sample}.
@group Reactive Primitive
*/
export function onMount(fn: () => void) {
  effect(() => sample(fn));
}
