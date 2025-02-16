// @ts-nocheck:
import type { Child } from './hyperscript.ts'
import {signal,untrack,batch,memo,root,wrap,onCleanup,type Signal, type Setter} from './reactive.ts'

export type ShowProps<T> = {
  when: T,
  children: Child | ((a:()=>T)=>void),
  fallback: unknown
}

/**
Show children if `when` prop is true, otherwise show `fallback`.
@group Components
*/
export function Show<T>(props:any) {
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

type ItemHolder = {
  index: number,
  indexSetter?: Setter<T>,
  value: T,
  valueSetter?: Setter<T>,
  disposer: ()=>void
}

export type ListProps<T> = {
  when: T,
  each: any,
  children: Child | ((a:()=>T)=>void),
  fallback: unknown
}

/**
List
@group Components
*/
export function List<T, U >(props:{
  each: Signal<T[]>,
  fallback?: any,
  children: (item: Signal<T[number]>, index: Signal<number>) => U
}) {
  const fallback = "fallback" in props && { fallback: () => props.fallback };
  return memo(listArray(props.each, props.children, fallback || undefined))
}

function listArray(
  list: Accessor<readonly T[] | undefined | null | false>,
  mapFn: (v: Accessor<T>, i: Accessor<number>) => U,
  options: { fallback?: Accessor<any> } = {}
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

  // const newItems = list.call ? list() : list
  // (newItems)[$TRACK]; // top level tracking

  return () => {
    console.log('list',list())
    const newItems = list() || [];
    // console.log('list', newItems)
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
      console.log('check change values when indexes match')
      for (j = unusedItems - 1; j >= 0; --j) {
        item = items[j]!
        oldIndex = item.index;
        if (!(oldIndex in temp) && oldIndex < newItems.length) {
          temp[oldIndex] = mapped[oldIndex]!
          newValue = newItems[oldIndex]!
          item.value = newValue
          console.log('List set value', newValueGetter, item.valueSetter)
          item.valueSetter?.(newValueGetter)
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
          // temp[i] = mapper()
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
    console.log('Change both', newValue)
    item!.index = i!
    item!.indexSetter?.(i)
    item!.value = newValue!
    item!.valueSetter?.(newValueGetter)
  }
  function mapper(disposer: ()=>void) {
    const V = newValue, I = i
    const t = {value: newValue, index: I, disposer}
    items.push(t)
    const sI = () => {t.indexSetter = I; return signal(I)}
    // const sV = () => {
    //   t.valueSetter = V;
    //   // let s = signal(V)
    //   return signal(V)
    // }
    let sV = () => {
      const k = I
      console.log('sV')
      sV = wrap(list, k)
      t.valueSetter = sV
      return sV()
    }
    return mapFn(() => sV(), () => sI())
  }
}

function disposeList(list:any[]) {
  for (let i = 0; i < list.length; i++) {
    list[i]?.disposer()
  }
}
