import {signal,sample,batch,memo,root,$TRACK} from './signal.ts'

/**
Show children if `when` prop is true, otherwise show `fallback`.
@group Components
*/
export function Show(props) {
  const condition = memo(()=>props.when)
  return memo(()=>{
    const c = condition()
    if (c) {
      const child = props.children
      const fn = typeof child === "function" && child.length > 0
      return fn ? sample(() => child(() => props.when)) : child
    } else return props.fallback
  })
}

export function wrap2(s,k) {
  const t = typeof k
  if (t === 'number') return (...a) => a.length ? (console.log('wrap nr',s(b => b.toSpliced(k, 1, a[0]))),s(b => b.toSpliced(k, 1, a[0]))) : s()[k]
  else if (t === 'string') return (...a) => (a.length) ? (console.log('wrap str',{...s(),[k]:a[0]}),s(b=>({...b, [k]:a[0]}))) : s()[k]
  else if (t === 'function') return (...a) => {
    const i = k(), c = typeof i
    console.log('wrap f',c,i,a)
    if (c==='number') return a.length ? s(old => old.toSpliced(i, 1, a[0])) : s()[i]
    else if (t === 'string') return a => a.length ? s(b=>({...b, [i]:a[0]})) : s()[i]
    throw new Error('Cannot wrap signal')
  }
  throw new Error('Cannot wrap signal')
}

export function wrap(s,k) {
  const t = typeof k
  if (t === 'number') return (...a) => a.length ? s(b => b.toSpliced(k, 1, a[0]))[k] : s()[k]
  else if (t === 'string') return (...a) => (a.length) ? s(b=>({...b, [k]:a[0]}))[k] : s()[k]
  else if (t === 'function') return (...a) => {
    const i = k(), c = typeof i
    if (c==='number') return a.length ? s(old => old.toSpliced(i, 1, a[0])) : s()[i]
    else if (t === 'string') return a => a.length ? s(b=>({...b, [i]:a[0]})) : s()[i]
    throw new Error('Cannot wrap signal')
  }
  throw new Error('Cannot wrap signal')
}

export function List2(props) {
  const fallback = "fallback" in props && { fallback: () => props.fallback }
  const list = props.each.call ? props.each : ()=>props.each
  const cb = props.children.call ? props.children : (v)=>v
  return memo(() => {
    const items = list()
    console.log('items',items)
    const res = items.map((v,i)=> {
      const index = signal(i), value = wrap(list, i)
      return cb(value,index)
    })
    console.log('res',res.map(r=>r()()))
    return () => res
  })
}

/**
List
@group Components
*/
export function List(props) {
  const fallback = "fallback" in props && { fallback: () => props.fallback }
  return memo(listArray(() => props.each, props.children, fallback || undefined))
}

export function listArray(list, mapFn, options = {}) {
  const items = []
  let mapped = [],
    unusedItems, i, j, item,
    oldValue, oldIndex,
    newValue, fallback,
    fallbackDisposer

  const ret = () => {
    const newItems = list() || []
    console.log('newItems',newItems);
    (newItems)[$TRACK] // top level tracking

    return sample(() => {
      console.log('sample newItems')
      if (newItems.length > 0 && fallbackDisposer) {
        fallbackDisposer()
        fallbackDisposer = undefined
        fallback = undefined
      }

      const temp = new Array(newItems.length) // new mapped array
      unusedItems = items.length

      // 1) no change when values & indexes match
      for (j = unusedItems - 1; j >= 0; --j) {
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
      for (j = unusedItems - 1; j >= 0; --j) {
        oldValue = items[j].value
        matcher.get(oldValue)?.push(j) ?? matcher.set(oldValue, [j])
      }

      // 2) change indexes when values match
      for (i = 0; i < newItems.length; ++i) {
        if (i in temp) continue
        newValue = newItems[i]
        j = matcher.get(newValue)?.pop() ?? -1
        if (j >= 0) {
          item = items[j]
          oldIndex = item.index
          temp[i] = mapped[oldIndex]
          item.index = i
          item.indexSetter?.(i)
          matchedItems[j] = 1
        }
      }

      // #2 reduce unusedItems for matched items
      for (j = matchedItems.length - 1; j >= 0; --j) {
        if (matchedItems[j] && --unusedItems !== j) {
          item = items[j]
          items[j] = items[unusedItems]
          items[unusedItems] = item
        }
      }

      // 3) change values when indexes match
      for (j = unusedItems - 1; j >= 0; --j) {
        item = items[j];
        oldIndex = item.index;
        if (!(oldIndex in temp) && oldIndex < newItems.length) {
          temp[oldIndex] = mapped[oldIndex]
          newValue = newItems[oldIndex]
          item.value = newValue
          item.valueSetter?.(newValueGetter)
          if (--unusedItems !== j) {
            items[j] = items[unusedItems]
            items[unusedItems] = item
          }
        }
      }

      // 4) change value & index when none matched
      // 5) create new if no unused items left
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

      if (newItems.length === 0 && options.fallback) {
        if (!fallbackDisposer) {
          fallback = [
            root(d => {
              fallbackDisposer = d
              return options.fallback()
            }),
          ]
        }
        return fallback;
      }
      return (mapped = temp);
    })
  }

  function newValueGetter() { return newValue }

  function changeBoth() {
    item.index = i
    item.indexSetter?.(i)
    item.value = newValue
    item.valueSetter?.(newValueGetter)
  }

  function mapper(disposer) {
    const t = {value: newValue, index: i, disposer},
      scopedV = newValue,
      scopedI = i;
    items.push(t)
    // signal created when used
    // let sV = (v) => {
    //   sW = wrap(list,scopedI)
    //   console.log('yo',sW())
    //   t.valueSetter = sW
    //   return sV
    // }
    let sI = () => {
      sI = scopedI
      t.indexSetter = sI
      return sI
    }
    let sW = wrap(list,sI)
    t.valueSetter = sW

    return mapFn(sW, ()=>sI())
  }

  return ret
}

function disposeList(list) {
  for (let i = 0; i < list.length; i++) {
    list[i]?.disposer()
  }
}
