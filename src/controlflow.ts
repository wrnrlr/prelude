// @ts-nocheck:
import type { Child } from './hyperscript.ts'
import {signal,untrack,batch,memo,root,onCleanup,type Signal, type Setter, type Mountable} from './reactive.ts'

export type ShowProps<T> = {
  when: T,
  children: Child | ((a:()=>T)=>void),
  fallback: unknown
}

/**
Show children if `when` prop is true, otherwise show `fallback`.
@group Components
*/
export function Show<T>(props:ShowProps) {
  const condition = memo(()=>props.when)
  return memo(()=>{
    const c = condition()
    if (c) {
      const child = props.children
      const fn = typeof child === "function" && child.length > 0
      return fn ? untrack(() => child(() => props.when)) : child
    } else return props.fallback
  })
}

export type ListProps<T, U extends Mountable, F = Getter | Signal> = {
  each: F<T[]>,
  children: (item: F<T>, index: F<number>) => U,
  fallback?: Mountable
}

/**
List
@group Components
*/
export function List<T>(
  props: ListProps<T>
) {
  const fallback = "fallback" in props && { fallback: () => props.fallback };
  return memo(listArray<T>(props.each, props.children, fallback || undefined))
}

type ItemHolder<T> = {
  index: number,
  indexSetter?: Getter<number>,
  value: T,
  valueSetter?: Setter<T>,
  disposer: ()=>void
}

function listArray<T, U extends Mountable>(
  list: Getter<T[]>,
  mapFn: (v: Getter<T>, i: Getter<number>) => U,
  options: { fallback?: Mountable } = {}
): () => U[]
function listArray<T, U extends Mountable>(
  list: Signal<T[]>,
  mapFn: (v: Signal<T>, i: Getter<number>) => U,
  options: { fallback?: Mountable } = {}
): () => U[]
function listArray<T, U extends Mountable>(
  list: Getter<T[]> | Signal<T[]>,
  mapFn: (v: Signal<T>, i: Getter<number>) => U,
  options: { fallback?: Mountable } = {}
): () => U[] {
  const items: ListItem<T>[] = [];
  let mapped: U[] = [],
    unusedItems: number,
    i: number,
    j: number,
    item: ListItem<T>,
    oldValue: T,
    oldIndex: number,
    newValue: T,
    fallback: U[] | undefined,
    fallbackDisposer: undefined | (() => void)

  onCleanup(() => {
    fallbackDisposer?.()
    fallbackDisposer = undefined
    disposeList(items)
  })

  return () => {
    const newItems = typeof list==='function' ? list() || [] : list;
    return untrack(() => {
      if (newItems.length > 0 && fallbackDisposer) {
        fallbackDisposer();
        fallbackDisposer = undefined;
        fallback = undefined;
      }

      const temp: U[] = new Array(newItems.length); // new mapped array
      unusedItems = items.length;

      // 1) no change when values & indexes match
      for (j = unusedItems - 1; j >= 0; --j) {
        item = items[j]!;
        oldIndex = item.index
        if (oldIndex < newItems.length && newItems[oldIndex] === item.value) {
          temp[oldIndex] = mapped[oldIndex]!
          if (--unusedItems !== j) {
            items[j] = items[unusedItems]!
            items[unusedItems] = item
          }
        }
      }

      // #2 prepare values matcher
      const matcher = new Map<T, number[]>()
      const matchedItems = new Uint8Array(unusedItems)
      for (j = unusedItems - 1; j >= 0; --j) {
        oldValue = items[j]!.value
        matcher.get(oldValue)?.push(j) ?? matcher.set(oldValue, [j])
      }

      // 2) change indexes when values match
      for (i = 0; i < newItems.length; ++i) {
        if (i in temp) continue
        newValue = newItems[i]!
        j = matcher.get(newValue)?.pop() ?? -1;
        if (j >= 0) {
          item = items[j]!
          oldIndex = item.index
          temp[i] = mapped[oldIndex]!
          item.index = i
          item.indexSetter?.(i)
          matchedItems[j] = 1
        }
      }

      // #2 reduce unusedItems for matched items
      for (j = matchedItems.length - 1; j >= 0; --j) {
        if (matchedItems[j] && --unusedItems !== j) {
          item = items[j]!
          items[j] = items[unusedItems]!
          items[unusedItems] = item
        }
      }

      // 3) change values when indexes match
      for (j = unusedItems - 1; j >= 0; --j) {
        item = items[j]!
        oldIndex = item.index;
        if (!(oldIndex in temp) && oldIndex < newItems.length) {
          temp[oldIndex] = mapped[oldIndex]!
          newValue = newItems[oldIndex]!
          item.value = newValue
          item.valueSetter?.(newValue)
          if (--unusedItems !== j) {
            items[j] = items[unusedItems]!
            items[unusedItems] = item
          }
        }
      }

      // 4) change value & index when none matched
      // 5) create new if no unused items left
      for (i = 0; i < newItems.length; ++i) {
        if (i in temp) continue;
        newValue = newItems[i]!;
        if (unusedItems > 0) {
          item = items[--unusedItems]!;
          temp[i] = mapped[item.index]!;
          batch(changeBoth);
        } else {
          temp[i] = root(mapper);
        }
      }

      // 6) delete any old unused items left
      disposeList(items.splice(0, unusedItems));

      if (newItems.length === 0 && options.fallback) {
        if (!fallbackDisposer) {
          fallback = [
            root(d => {
              fallbackDisposer = d;
              return options.fallback!();
            }),
          ];
        }
        return fallback!;
      }
      return (mapped = temp);
    })
  }
  // const indexes = cb.length > 1 ? [] : null;
  function newValueGetter(_:unknown) { return newValue }
  function changeBoth() {
    item!.index = i!
    item!.indexSetter?.(i)
    item!.value = newValue!
    item!.valueSetter?.(newValueGetter)
  }
  function mapper(disposer: ()=>void) {
    const V = newValue
    const I = i
    const t = {value: newValue, index: I, disposer}
    items.push(t)
    const sI = () => { t.indexSetter = I; return signal(I) }
    let sV = (...a) => {
      const k = I
      sV = (...a) => {
        if (a.length===0) {
          const bk = list()[k]
          return bk
        } else {
          const b = untrack(list)
          return list(b.toSpliced(k, 1, a[0])).at(k)
        }
      }
      t.valueSetter = sV
      return sV(...a)
    }
    return mapFn(sV, () => sI())
  }
}

function disposeList(list:any[]) {
  for (let i = 0; i < list.length; i++) {
    list[i]?.disposer()
  }
}
