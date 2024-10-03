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

const log = (m,v=m) => (console.debug(m,v),v)

export function wrap(s,k) {
  const t = typeof k
  if (t === 'number') return (...a) => {
    const b = s()
    return (a.length) ? s(b.toSpliced(k, 1, a[0])).at(k) : b.at(k)
  }; else if (t === 'string') return (...a) => {
    const b = s()
    return a.length ? s(({ ...b, [k]: a[0] }))[k] : b[k]
  }; else if (t === 'function') return (...a) => {
    const i = k(), c = typeof i
    if (c==='number') return a.length ? s(old => old.toSpliced(i, 1, a[0]))[i] : s()[i]
    else if (c === 'string') return a => a.length ? s(b => ({...b, [i]:a[0]}))[i] : s()[i]
    throw new Error('Cannot wrap signal')
  }
  throw new Error('Cannot wrap signal')
}

/**
List
@group Components
*/
export function List(props) {
  const fallback = "fallback" in props && { fallback: () => props.fallback }
  const list = props.each.call ? props.each : ()=>props.each
  const cb = props.children.call ? props.children : (v)=>v
  let items = [], item, unusedItems, i, j, newValue, mapped, oldIndex, oldValue
  function newValueGetter() { return newValue }
  function changeBoth() {
    item.index = i
    item.indexSetter?.(i)
    item.value = newValue
    item.valueSetter?.(newValueGetter)
  }
  function mapper(disposer) {
    const scopedV = newValue, scopedI = i;
    const indexSetter = signal(scopedI), valueSetter = signal(scopedV)
    const t = {value: newValue, index: scopedI, disposer, indexSetter, valueSetter}
    items.push(t)
    return cb((...a)=>valueSetter(...a),(...a)=>indexSetter(...a))
  }
  return memo(() => {
    const newItems = list() || []
    // (newItems)[$TRACK]; // top level tracking
    return sample(() => {
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
          console.log('set value')
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
          console.log('make value')
          temp[i] = root(mapper)
        }
      }

      // 6) delete any old unused items left
      disposeList(items.splice(0, unusedItems))

      return (mapped = temp);
    })
  })
}

function disposeList(list) {
  for (let i = 0; i < list.length; i++) {
    list[i]?.disposer()
  }
}
