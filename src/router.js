// @ts-nocheck
import { signal, effect, batch, untrack, memo, wrap, context, useContext, onMount } from './reactive.ts'
import { h } from './web.ts'

const RouterCtx = context()
export const useRouter = () => useContext(RouterCtx)
export const useNavigate = () => wrap(useRouter(),'navigate')
export const useParams = () => wrap(useRouter(),'params')
export const useSearch = () => wrap(useRouter(),'search')

export function Router(props) {
  const BASE = props.base || ''
  const routes = props.children
  const NotFound = () => 'Not found'
  const navigate = signal(null)
  const params = signal(null)
  const search = signal(null)
  function stripBase(fullPath) {
    if (fullPath.startsWith(BASE)) {
      return fullPath.slice(BASE.length) || '/'
    }
    return fullPath
  }
  function withBase(relPath) {
    if (!relPath.startsWith('/')) relPath = '/' + relPath;
    return BASE + relPath;
  }
  function navigateTo(fullPath) {
    const stripedPath = stripBase(fullPath)
    history.pushState({}, '', withBase(stripedPath));
    navigate({pathname:stripedPath});
  }
  onMount(() => {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a')
      if (!target) return
      const url = new URL(target.href);
      if (url.origin === window.location.origin && url.pathname.startsWith(BASE)) {
        e.preventDefault()
        const pathname = url.pathname + url.search + url.hash
        navigateTo(pathname)
      }
    })
    const pathname = stripBase(window.location.pathname + window.location.search + window.location.hash)
    navigate({pathname})
    // Listen to browser history navigation (back/forward)
    const popHandler = () => {
      const path = stripBase(window.location.pathname + window.location.search + window.location.hash)
      navigate({ pathname: path })
    }
    window.addEventListener('popstate', popHandler)
  })
  // TODO cleanup click and popstate handlers...
  const children = () => {
    const location = navigate()
    // console.log('loc', location)
    const route = matchRoute(routes, location.pathname)
    return route?.component({params: route.params}) || NotFound
  }
  return h(RouterCtx, {value:{navigate:navigateTo,params,search}}, children)
  // return RouterCtx({navigate,params,search,children})
}

function bindEvent(target, type, handler) {
  target.addEventListener(type, handler)
  return () => target.removeEventListener(type, handler)
}

function scrollToHash(hash, fallbackTop) {
  const el = hash && document.getElementById(hash);
  if (el) {
    el.scrollIntoView();
  } else if (fallbackTop) {
    window.scrollTo(0, 0);
  }
}

function matchRoute(routes, pathname) {
  // Normalize and split incoming path
  const trim = str => {
    // console.log('str', str)
    return str.replace(/(^\/|\/$)/g, '')
  }
  // console.log('pathname', pathname)
  const requestSegments = trim(pathname).split('/').filter(Boolean);

  for (const route of routes) {
    // console.log(route, route.path)
    const routeSegments = trim(route.path).split('/').filter(Boolean);
    if (routeSegments.length !== requestSegments.length) continue;

    const params = {};
    let matched = true;

    for (let i = 0; i < routeSegments.length; i++) {
      const rSeg = routeSegments[i];
      const pSeg = requestSegments[i];

      if (rSeg.startsWith(':')) {
        // dynamic parameter
        const paramName = rSeg.slice(1);
        params[paramName] = decodeURIComponent(pSeg);
      } else if (rSeg === pSeg) {
        // exact segment match
      } else {
        matched = false;
        break;
      }
    }

    if (matched) return { component: route.component, params }
  }
  return null;
}
