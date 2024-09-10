import {signal,sample,batch,memo} from './signal.ts'

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

/**
List
@group Components
*/
export function List(props) {

}

const $TRACK = Symbol('track')

// export function wrap(s,k) {
//   if (typeof k === 'string') {
//     return (...args) => {
//       if (args.length) {
//         return s({...s(),[k]:args[0]})
//       } else {
//         return s()[k]
//       }
//     }
//   } else {
//     return (...args) => {
//       if (args.length) {
//         return s(old=>old.toSpliced(k,1,args[0]))
//       } else {
//         return s()[k]
//       }
//     }
//   }
// }
//
// function disposeList(list) {
//   for (let i = 0; i < list.length; i++) {
//     list[i]?.disposer()
//   }
// }
//
// // Copyright (c) 2021 Solid Primitives Working Group
// export function listArray(list, mapFn, options = {}) {
//   const items = [];
//   let mapped = [],
//     unusedItems, i, j, item,
//     oldValue, oldIndex,
//     newValue, fallback,
//     fallbackDisposer;
//
//   return () => {
//     const newItems = list() || [];
//     (newItems)[$TRACK]; // top level tracking
//     return sample(() => {
//       if (newItems.length > 0 && fallbackDisposer) {
//         fallbackDisposer();
//         fallbackDisposer = undefined;
//         fallback = undefined;
//       }
//
//       const temp = new Array(newItems.length); // new mapped array
//       unusedItems = items.length;
//
//       // 1) no change when values & indexes match
//       for (j = unusedItems - 1; j >= 0; --j) {
//         item = items[j];
//         oldIndex = item.index;
//         if (oldIndex < newItems.length && newItems[oldIndex] === item.value) {
//           temp[oldIndex] = mapped[oldIndex];
//           if (--unusedItems !== j) {
//             items[j] = items[unusedItems];
//             items[unusedItems] = item;
//           }
//         }
//       }
//
//       // #2 prepare values matcher
//       const matcher = new Map();
//       const matchedItems = new Uint8Array(unusedItems);
//       for (j = unusedItems - 1; j >= 0; --j) {
//         oldValue = items[j].value;
//         matcher.get(oldValue)?.push(j) ?? matcher.set(oldValue, [j]);
//       }
//
//       // 2) change indexes when values match
//       for (i = 0; i < newItems.length; ++i) {
//         if (i in temp) continue;
//         newValue = newItems[i];
//         j = matcher.get(newValue)?.pop() ?? -1;
//         if (j >= 0) {
//           item = items[j];
//           oldIndex = item.index;
//           temp[i] = mapped[oldIndex];
//           item.index = i;
//           item.indexSetter?.(i);
//           matchedItems[j] = 1;
//         }
//       }
//
//       // #2 reduce unusedItems for matched items
//       for (j = matchedItems.length - 1; j >= 0; --j) {
//         if (matchedItems[j] && --unusedItems !== j) {
//           item = items[j];
//           items[j] = items[unusedItems];
//           items[unusedItems] = item;
//         }
//       }
//
//       // 3) change values when indexes match
//       for (j = unusedItems - 1; j >= 0; --j) {
//         item = items[j];
//         oldIndex = item.index;
//         if (!(oldIndex in temp) && oldIndex < newItems.length) {
//           temp[oldIndex] = mapped[oldIndex];
//           newValue = newItems[oldIndex];
//           item.value = newValue;
//           item.valueSetter?.(newValueGetter);
//           if (--unusedItems !== j) {
//             items[j] = items[unusedItems];
//             items[unusedItems] = item;
//           }
//         }
//       }
//
//       // 4) change value & index when none matched
//       // 5) create new if no unused items left
//       for (i = 0; i < newItems.length; ++i) {
//         if (i in temp) continue;
//         newValue = newItems[i];
//         if (unusedItems > 0) {
//           item = items[--unusedItems];
//           temp[i] = mapped[item.index];
//           batch(changeBoth);
//         } else {
//           temp[i] = createRoot(mapper);
//         }
//       }
//
//       // 6) delete any old unused items left
//       disposeList(items.splice(0, unusedItems));
//
//       if (newItems.length === 0 && options.fallback) {
//         if (!fallbackDisposer) {
//           fallback = [
//             createRoot(d => {
//               fallbackDisposer = d;
//               return options.fallback();
//             }),
//           ];
//         }
//         return fallback;
//       }
//       return (mapped = temp);
//     })
//   }
//   function newValueGetter() { return newValue }
//   function changeBoth() {
//     item.index = i;
//     item.indexSetter?.(i);
//     item.value = newValue;
//     item.valueSetter?.(newValueGetter);
//   }
//   function mapper(disposer) {
//     const t = {value: newValue, index: i, disposer},
//       scopedV = newValue,
//       scopedI = i;
//     items.push(t);
//     // signal created when used
//     let sV = () => {
//       sV = signal(scopedV)
//       return sV()
//     }
//     let sI = () => {
//       sI = signal(scopedI);
//       t.indexSetter = sI
//       return sI()
//     }
//
//     return mapFn(() => sV(), () => sI())
//   }
// }
//
// function createRoot(fn) { return fn() }
