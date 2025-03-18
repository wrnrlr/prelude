/*
MIT License

Copyright (c) 2016-2025 Ryan Carniato

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
// @ts-nocheck
import {signal,effect,batch,untrack,memo,wrap,context,useContext,onMount} from './reactive.ts'
// import {h} from './hyperscript.ts'

const Ctx = context()
const useRouter = () => useContext(Ctx)
export const useNavigate = () => wrap(useRouter(),'navigate')
export const useParams = () => wrap(useRouter(),'params')
export const useSearch = () => wrap(useRouter(),'search')

export function HashRouter(props) {
  const routes = props.children
  const NotFound = ()=>'Not found'
  const render = () => {console.log('render')}
  // const loaded = signal(false)
  const navigate = signal(null)
  const params = signal(null)
  const search = signal(null)
  onMount(()=>{
    window.addEventListener("popstate", (event) => {
      batch(()=>navigate(parseHash(document.location.hash)))
    })
    navigate(parseHash(document.location.hash))
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
