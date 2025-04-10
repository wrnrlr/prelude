import {memo, untrack, children, type Getter} from './reactive.ts'

/**
 * Switches between content based on mutually exclusive conditions
 * ```typescript
 * <Switch fallback={<FourOhFour />}>
 *   <Match when={state.route === 'home'}>
 *     <Home />
 *   </Match>
 *   <Match when={state.route === 'settings'}>
 *     <Settings />
 *   </Match>
 * </Switch>
 * ```
 * @description https://docs.solidjs.com/reference/components/switch-and-match
 */
export function Switch(props: { fallback?: any; children: any }): any {
  const chs = children(() => props.children);
  const switchFunc = memo(() => {
    const ch = chs() as unknown as MatchProps<unknown> | MatchProps<unknown>[];
    const mps = Array.isArray(ch) ? ch : [ch];
    let func: Getter<any | undefined> = () => undefined;
    for (let i = 0; i < mps.length; i++) {
      const index = i;
      const mp = mps[i];
      const prevFunc = func;
      const conditionValue = memo(
        () => (prevFunc() ? undefined : mp.when),
        undefined, undefined
      );
      const condition = mp.keyed
        ? conditionValue
        : memo(
            conditionValue,
            undefined,
            { equals: (a, b) => !a === !b }
          );
      func = () => prevFunc() || (condition() ? [index, conditionValue, mp] : undefined);
    }
    return func;
  });
  return memo(
    () => {
      const sel = switchFunc()();
      if (!sel) return props.fallback;
      const [index, conditionValue, mp] = sel;
      const child = mp.children;
      const fn = typeof child === "function" && child.length > 0;
      return fn
        ? untrack(() =>
            (child as any)(
              mp.keyed
                ? (conditionValue() as any)
                : () => {
                    if (untrack(switchFunc)()?.[0] !== index) throw 'Stale read from Switch'
                    return conditionValue();
                  }
            )
          )
        : child;
    },
    undefined,
    undefined
  ) as unknown as any;
}

export type MatchProps<T> = {
  when: T | undefined | null | false;
  keyed?: boolean;
  children: any | ((item: NonNullable<T> | Getter<NonNullable<T>>) => any);
};
/**
 * Selects a content based on condition when inside a `<Switch>` control flow
 * ```typescript
 * <Match when={condition()}>
 *   <Content/>
 * </Match>
 * ```
 * @description https://docs.solidjs.com/reference/components/switch-and-match
 */
export function Match<
  T,
  TRenderFunction extends (item: Getter<NonNullable<T>>) => any
>(props: {
  when: T | undefined | null | false;
  keyed?: false;
  children: any;
}): any;
export function Match<T, TRenderFunction extends (item: NonNullable<T>) => any>(props: {
  when: T | undefined | null | false;
  keyed: true;
  children: any;
}): any;
export function Match<T>(props: MatchProps<T>) {
  return props as unknown as any;
}
