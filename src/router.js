// @ts-nocheck
import {signal,effect,batch,untrack,memo,wrap,context,useContext,onMount} from './reactive.ts'
// import {h} from './hyperscript.ts'

const Ctx = context()
const useRouter = () => useContext(Ctx)
export const useNavigate = () => wrap(useRouter(),'navigate')
export const useParams = () => wrap(useRouter(),'params')
export const useSearch = () => wrap(useRouter(),'search')

export function Router(props) {
  const routes = props.children
  const NotFound = ()=>'Not found'
  const render = () => {console.log('render')}
  // const loaded = signal(false)
  const navigate = signal(null)
  const params = signal(null)
  const search = signal(null)
  onMount(()=>{
    window.addEventListener("popstate", (event) => {
      batch(()=>{
        const hash = parseHash(document.location.hash)
        navigate(hash)
      })
    })
    const hash = parseHash(document.location.hash)
    navigate(hash)
  })
  const children = memo(() => {
    let location = navigate()
    const route = routes.find(r=>r.path===location.pathname)
    return route?.component() || NotFound
  })
  return Ctx({navigate,params,search,children:()=>children})
}

function parseHash(s) {
  const res = {pathname:'/'}
  if (s[0]!=='#') return res
  s = s.substr(1)

  let i = s.indexOf('?')
  if (i===-1) i = s.length
  res.pathname += s.substr(0,i)
  if (res.pathname==='') res.pathname = '/'
  return res
}

function parsePathname(s) {
  let i = s.indexOf('?', 0)
  if (i===-1) i = s.length
  return s.substr(0,i)
}

function parseSearch(s) {

}

export function Route(props) {

}

export function A(props) {

}
