// @ts-nocheck:
import type { Child } from './hyperscript.ts'
import {signal,untrack,batch,memo,root,type Signal} from './reactive.ts'

export type ShowProps<T> = {
  when: T,
  children: Child | ((a:()=>T)=>void),
  fallback: unknown
}

/**
Show children if `when` prop is true, otherwise show `fallback`.
@group Components
*/
export function Show<T>(props:ShowProps<T>) {
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
  index:number,
  indexSetter?:any,
  value:unknown,
  valueSetter:any,
  disposer: any
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
export function List<T>(props:ListProps<T>) {
  const fallback = "fallback" in props && { fallback: () => props.fallback }
  const list = props.each
  const cb:any = (props.children as any)?.call ? props.children : (v:any)=>v
  let items:ItemHolder[] = [],
    item: undefined|ItemHolder,
    // unusedItems,
    i: undefined|number,
    newValue: undefined|number,
    mapped: number[],
    oldIndex: number,
    oldValue: unknown
  const indexes = cb.length > 1 ? [] : null;
  function newValueGetter(_:unknown) { return newValue }
  function changeBoth() {
    item!.index = i!
    item!.indexSetter?.(i)
    item!.value = newValue!
    item!.valueSetter?.(newValueGetter)
  }
  function mapperWithIndexes(disposer:any) {
    const V = newValue, I = i, Is = signal(I), Vs = signal(V)
    items.push({value: newValue, index: I!, disposer, indexSetter: Is, valueSetter: Vs})
    return cb(
      (...a:any[]) => a.length ?
        untrack(()=>list((list:any)=>list.toSpliced(I,1,a[0])))
        : Vs(),
      ()=>Is())
  }
  function mapperWithoutIndexes(disposer:any) {
    const V = newValue, I = i, Vs = signal(V)
    items.push({value: V, index: i!, disposer, valueSetter: Vs})
    return cb((...a:unknown[]) => a.length ?
      untrack(()=>list((list:any)=>list.toSpliced(I,1,a[0])))
      : Vs())
  }
  const mapper = indexes ? mapperWithIndexes : mapperWithoutIndexes
  return memo(() => {
    console.log('list:',list)
    const newItems = list.call ? list() : []
    // (newItems)[$TRACK]; // top level tracking
    return untrack(() => {
      const temp = new Array(newItems.length) // new mapped array
      let unusedItems = items.length

      // 1) no change when values & indexes match
      for (let j = unusedItems - 1; j >= 0; --j) {
        item = items[j]
        oldIndex = item.index
        if (oldIndex < newItems.length && newItems[oldIndex] === item.value) {
          temp[oldIndex] = mapped[oldIndex]
          if (--unusedItems !== j) {
            items[j] = items[unusedItems]
            items[unusedItems] = item
          }
        }
      }

      // #2 prepare values matcher
      const matcher = new Map()
      const matchedItems = new Uint8Array(unusedItems)
      for (let j = unusedItems - 1; j >= 0; --j) {
        oldValue = items[j].value
        matcher.get(oldValue)?.push(j) ?? matcher.set(oldValue, [j])
      }

      // 2) change indexes when values match
      for (i = 0; i < newItems.length; ++i) {
        if (i in temp) continue
        newValue = newItems[i]
        const j = matcher.get(newValue)?.pop() ?? -1
        if (j >= 0) {
          item = items[j as number]
          oldIndex = item!.index
          temp[i] = mapped[oldIndex]
          item!.index = i
          item!.indexSetter?.(i)
          matchedItems[j as number] = 1
        }
      }

      // 3) reduce unusedItems for matched items
      for (let j = matchedItems.length - 1; j >= 0; --j) {
        if (matchedItems[j] && --unusedItems !== j) {
          item = items[j]
          items[j] = items[unusedItems]
          items[unusedItems] = item
        }
      }

      // 4) change values when indexes match
      for (let j = unusedItems - 1; j >= 0; --j) {
        item = items[j];
        oldIndex = item!.index;
        if (!(oldIndex in temp) && oldIndex < newItems.length) {
          temp[oldIndex] = mapped[oldIndex]
          newValue = newItems[oldIndex]
          item.value = newValue
          item.valueSetter?.(item.valueSetter)
          if (--unusedItems !== j) {
            items[j] = items[unusedItems]
            items[unusedItems] = item
          }
        }
      }

      // 5) change value & index when none matched and create new if no unused items left
      for (i = 0; i < newItems.length; ++i) {
        if (i in temp) continue
        newValue = newItems[i]
        if (unusedItems > 0) {
          item = items[--unusedItems]
          temp[i] = mapped[item.index]
          batch(changeBoth);
        } else {
          temp[i] = root(mapper)
        }
      }

      // 6) delete any old unused items left
      disposeList(items.splice(0, unusedItems))

      return (mapped = temp);
    })
  })
}

function disposeList(list:any[]) {
  for (let i = 0; i < list.length; i++) {
    list[i]?.disposer()
  }
}
