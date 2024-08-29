import {signal,sample,type Getter} from './signal.ts'

/**
@group Components
*/
export function For(props:any):any {

}

// export function mapArray<T, U>(
//   list: Getter<readonly T[] | undefined | null | false>,
//   mapFn: (v: T, i: Getter<number>) => U,
//   options: { fallback?: Getter<any> } = {}
// ): () => U[] {
//   let items: (T | typeof FALLBACK)[] = [],
//     mapped: U[] = [],
//     disposers: (() => void)[] = [],
//     len = 0,
//     indexes: ((v: number) => number)[] | null = mapFn.length > 1 ? [] : null;

//   onCleanup(() => dispose(disposers));
//   return () => {
//     let newItems = list() || [],
//       i: number,
//       j: number;
//     (newItems as any)[$TRACK]; // top level tracking
//     return untrack(() => {
//       let newLen = newItems.length,
//         newIndices: Map<T | typeof FALLBACK, number>,
//         newIndicesNext: number[],
//         temp: U[],
//         tempdisposers: (() => void)[],
//         tempIndexes: ((v: number) => number)[],
//         start: number,
//         end: number,
//         newEnd: number,
//         item: T | typeof FALLBACK;

//       // fast path for empty arrays
//       if (newLen === 0) {
//         if (len !== 0) {
//           dispose(disposers);
//           disposers = [];
//           items = [];
//           mapped = [];
//           len = 0;
//           indexes && (indexes = []);
//         }
//         if (options.fallback) {
//           items = [FALLBACK];
//           mapped[0] = createRoot(disposer => {
//             disposers[0] = disposer;
//             return options.fallback!();
//           });
//           len = 1;
//         }
//       }
//       // fast path for new create
//       else if (len === 0) {
//         mapped = new Array(newLen);
//         for (j = 0; j < newLen; j++) {
//           items[j] = newItems[j];
//           mapped[j] = createRoot(mapper);
//         }
//         len = newLen;
//       } else {
//         temp = new Array(newLen);
//         tempdisposers = new Array(newLen);
//         indexes && (tempIndexes = new Array(newLen));

//         // skip common prefix
//         for (
//           start = 0, end = Math.min(len, newLen);
//           start < end && items[start] === newItems[start];
//           start++
//         );

//         // common suffix
//         for (
//           end = len - 1, newEnd = newLen - 1;
//           end >= start && newEnd >= start && items[end] === newItems[newEnd];
//           end--, newEnd--
//         ) {
//           temp[newEnd] = mapped[end];
//           tempdisposers[newEnd] = disposers[end];
//           indexes && (tempIndexes![newEnd] = indexes[end]);
//         }

//         // 0) prepare a map of all indices in newItems, scanning backwards so we encounter them in natural order
//         newIndices = new Map<T, number>();
//         newIndicesNext = new Array(newEnd + 1);
//         for (j = newEnd; j >= start; j--) {
//           item = newItems[j];
//           i = newIndices.get(item)!;
//           newIndicesNext[j] = i === undefined ? -1 : i;
//           newIndices.set(item, j);
//         }
//         // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
//         for (i = start; i <= end; i++) {
//           item = items[i];
//           j = newIndices.get(item)!;
//           if (j !== undefined && j !== -1) {
//             temp[j] = mapped[i];
//             tempdisposers[j] = disposers[i];
//             indexes && (tempIndexes![j] = indexes[i]);
//             j = newIndicesNext[j];
//             newIndices.set(item, j);
//           } else disposers[i]();
//         }
//         // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
//         for (j = start; j < newLen; j++) {
//           if (j in temp) {
//             mapped[j] = temp[j];
//             disposers[j] = tempdisposers[j];
//             if (indexes) {
//               indexes[j] = tempIndexes![j];
//               indexes[j](j);
//             }
//           } else mapped[j] = createRoot(mapper);
//         }
//         // 3) in case the new set is shorter than the old, set the length of the mapped array
//         mapped = mapped.slice(0, (len = newLen));
//         // 4) save a copy of the mapped items for the next update
//         items = newItems.slice(0);
//       }
//       return mapped;
//     });
//     function mapper(disposer: () => void) {
//       disposers[j] = disposer;
//       if (indexes) {
//         const [s, set] = "_SOLID_DEV_" ? createSignal(j, { name: "index" }) : createSignal(j);
//         indexes[j] = set;
//         return mapFn(newItems[j], s);
//       }
//       return (mapFn as any)(newItems[j]);
//     }
//   };
// }

// export function For<T extends readonly any[], U extends JSX.Element>(props: {
//   each: T | undefined | null | false;
//   fallback?: JSX.Element;
//   children: (item: T[number], index: Accessor<number>) => U;
// }) {
//   const fallback = "fallback" in props && { fallback: () => props.fallback };
//   return createMemo(
//         mapArray(() => props.each, props.children, fallback || undefined)
//       ) as unknown as JSX.Element;
// }
