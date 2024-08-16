/// Basic signal & effect library

export type Display<T> = {toJSON():T;valueOf():T,toString():string}
export type Getter<T> = {():T; peek():T}
export type Setter<T> = {(a:T):T; (a:(v:T)=>T):T}
export type Observable = { add(e:Observable):void; delete(e:Observable):void; dispose():void}
export type Effect = Observable & {fn():void}
export type Computed<T> = Observable & Getter<T> & Display<T>
export type Signal<T> = Computed<T> & Setter<T> & {get():T;set(a:T):T;} & Display<T>

export function signal<T>(value:T):Signal<T> {
  const effects = new Set<Effect>, self:any = {
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
    add: (e:Effect) => effects.add(e),
    delete: (e:Effect) => effects.delete(e),
    peek: () => self.value,
    valueOf: () => self.get(),
    toString: () => String(self.get()),
    toJSON: () => self.get(),
  }
  const f = Object.assign((...args:T[]) => args.length ? self.set(args[0] as any) as T : self.get() as T, self)
  return f as Signal<T>
}

export function computed<T>(fn:(v?:T)=>T, value?:T):Computed<T> {
  const self:any = {
    e: null,
    value: value,
    fn: fn,
    peek: () => self.value,
    valueOf: () => self.get(),
    toString: () => String(self.get()),
    toJSON: () => self.get(),
  }
  const f = Object.assign(() => {
    if (!self.e) (self.e = create(()=>self.value=self.fn(self.value))).fn()
    return self.value
  },self)
  return f as Computed<T>
}

export function effect<T>(fn:(v?:T)=>T|undefined, value?:T):()=>void {
  let teardown:any
  let fx = create(() => { teardown?.call?.(); teardown = fn() });
  if (EFFECT) EFFECT.add(fx);
  fx.fn();
  const ret = () => (teardown?.call?.(), fx.dispose())
  return ret
}

function effect2(fn:()=>void):Effect {
  const effects = new Set<Effect>
  const self = {
    effects,
    fn,
    add: (e:Effect) => effects.add(e),
    delete: (e:Effect) => effects.delete(e),
    dispose: () => {
      for (const entry of cleared(effects)) {
        entry.delete(self);
        entry.dispose?.();
      }
    }
  }
  return self
}

function create(block:()=>void):Effect {
const e = effect2(() => {
    const prev = EFFECT
    EFFECT = e
    try { block() }
    finally { EFFECT = prev }
  })
  return e
}

export function sample<T>(fn:()=>T):T {
  const prev = EFFECT
  EFFECT = null
  const result =  fn()
  EFFECT = prev
  return result
}

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

// export function memo<T>(fn:()=>T, equal:T):T {
//   if (typeof fn !== "function") return fn;
//   if (!equal) return effect(fn);
//   const s = signal(sample(fn));
//   effect(() => s(fn()));
//   return s;
// }

let EFFECT:null|Effect = null
let BATCHES:null|Set<Effect> = null

function cleared(self:Set<Effect>):Effect[] {
  const entries = [...self];
  self.clear();
  return entries;
}
