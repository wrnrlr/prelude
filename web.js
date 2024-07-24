import { getNextElement, insert, spread, SVGElements, hydrate as hydrateCore } from "./dom.js";
import {
  createSignal,
  createMemo,
  onCleanup,
  untrack,
  splitProps,
  createRoot,
  sharedConfig,
  enableHydration,
  $DEVCOMP,
  createEffect,
  getOwner,
  runWithOwner
} from "solid-js";

export * from "./dom.js";

export {
  For,
  Show,
  Suspense,
  SuspenseList,
  Switch,
  Match,
  Index,
  ErrorBoundary,
  mergeProps
} from "solid-js";

export * from "./server-mock.js";

export const isServer = false;
export const isDev = "_SOLID_DEV_";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function createElement(tagName, isSVG) {
  return isSVG ? document.createElementNS(SVG_NAMESPACE, tagName) : document.createElement(tagName);
}

export const hydrate = (...args) => {
  enableHydration();
  return hydrateCore(...args);
}

/**
 * Renders components somewhere else in the DOM
 *
 * Useful for inserting modals and tooltips outside of an cropping layout. If no mount point is given, the portal is inserted in document.body; it is wrapped in a `<div>` unless the target is document.head or `isSVG` is true. setting `useShadow` to true places the element in a shadow root to isolate styles.
 *
 * @description https://docs.solidjs.com/reference/components/portal
 */
export function Portal(props) {
  const { useShadow } = props,
    marker = document.createTextNode(""),
    mount = () => props.mount || document.body,
    owner = getOwner();
  let content;
  let hydrating = !!sharedConfig.context;

  createEffect(
    () => {
      // basically we backdoor into a sort of renderEffect here
      if (hydrating) (getOwner()).user = hydrating = false;
      content || (content = runWithOwner(owner, () => createMemo(() => props.children)));
      const el = mount();
      if (el instanceof HTMLHeadElement) {
        const [clean, setClean] = createSignal(false);
        const cleanup = () => setClean(true);
        createRoot(dispose => insert(el, () => (!clean() ? content() : dispose()), null));
        onCleanup(cleanup);
      } else {
        const container = createElement(props.isSVG ? "g" : "div", props.isSVG),
          renderRoot =
            useShadow && container.attachShadow
              ? container.attachShadow({ mode: "open" })
              : container;

        Object.defineProperty(container, "_$host", {
          get() {
            return marker.parentNode;
          },
          configurable: true
        });
        insert(renderRoot, content);
        el.appendChild(container);
        props.ref && (props).ref(container);
        onCleanup(() => el.removeChild(container));
      }
    },
    undefined,
    { render: !hydrating }
  );
  return marker;
}

/**
 * Renders an arbitrary custom or native component and passes the other props
 * ```typescript
 * <Dynamic component={multiline() ? 'textarea' : 'input'} value={value()} />
 * ```
 * @description https://docs.solidjs.com/reference/components/dynamic
 */
export function Dynamic(props) {
  const [p, others] = splitProps(props, ["component"]);
  const cached = createMemo(() => p.component);
  return createMemo(() => {
    const component = cached();
    switch (typeof component) {
      case "function":
        if ("_DX_DEV_") Object.assign(component, { [$DEVCOMP]: true });
        return untrack(() => component(others));

      case "string":
        const isSvg = SVGElements.has(component);
        const el = sharedConfig.context ? getNextElement() : createElement(component, isSvg);
        spread(el, others, isSvg);
        return el;

      default:
        break;
    }
  });
}
