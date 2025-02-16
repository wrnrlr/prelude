import {runtime} from '../src/runtime.ts'
import {hyperscript} from '../src/hyperscript.ts'
import {signal,root} from '../src/reactive.ts'
import { Window } from 'happy-dom'
import {assertEquals} from '@std/assert'

const window = new Window
const r = runtime(window), h = hyperscript(r)

function testing(name, props, f=props) {
  const htest = t => (name, f) => {
    let disposer
    return root(dispose => {
      disposer = () => {
        window.document.body.textContent = ''
        r.clearDelegatedEvents()
        dispose()
      }
      return t.step(name, f).then(disposer)
    })
  }
  Deno.test(name, async t => await f(htest(t)))
}

function assertHTML(t, e, msg) { assertEquals(t().outerHTML, e, msg) }

testing('h with basic element', async test => {
  await test('empty tag', () => assertHTML(h(''), '<div></div>'))
  await test('tag with id', () => assertHTML(h('#a'), '<div id="a"></div>'))
  await test('tag with class', () => assertHTML(h('.a'), '<div class="a"></div>'))
  await test('tag with id & classes', () => assertHTML(h('i#a.b.c'), '<i id="a" class="b c"></i>'))
  await test('tag with tag class and prop class', () => assertHTML(h('hr.a', {class:'b'}), '<hr class="a b">'))
  await test('tag with tag class and dynamic prop class', () => assertHTML(h('hr.a', {class:()=>'b'}), '<hr class="a b">'))
  await test('tag with tag class and undeefined prop class', () => assertHTML(h('hr.a', {class:undefined}), '<hr class="a">'))
  await test('tag with tag class and dynamic undeefined prop class', () => assertHTML(h('hr.a', {class:()=>undefined}), '<hr class="a">'))
  await test('no props or children', () => assertHTML(h('hr'), '<hr>'))
  await test('boolean content', () => assertHTML(h('b',true), '<b>true</b>'))
  await test('string content', () => assertHTML(h('b','A'), '<b>A</b>'))
  await test("number content", () => assertHTML(h('i',1), '<i>1</i>'))
  await test("bigint content", () => assertHTML(h('i',2n), '<i>2</i>'))
  await test("symbol content", () => assertHTML(h('i',Symbol('A')), '<i>Symbol(A)</i>'))
  // await test('regex content', () => assertHTML(h('b',/\w/), '<b>/\\w/</b>'))
  await test("signal content", () => assertHTML(h('i',()=>1), '<i>1</i>'))
  await test('array content', () => assertHTML(h('i',['A',1,2n]), '<i>A12</i>'))
  await test('ref property', () => assertHTML(h('hr',{ref:el=>el.setAttribute('a','1')}), '<hr a="1">'))
  await test('style property sets style attribute', () => assertHTML(h('hr',{style:'color:red'}), '<hr style="color: red;">'))
  await test('htmlFor property sets for attribute', () => assertHTML(h('label',{htmlFor:'a'}), '<label for="a"></label>'))
  await test('classList property sets class attribute', () => assertHTML(h('hr', {classList:()=>({a:true})}), '<hr class="a">'))
  await test('custom attribute', () => assertHTML(h('hr', {'attr:a':'b'}), '<hr a="b">'))
  await test('custom empty attribute', () => assertHTML(h('hr', {'attr:data-a':''}), '<hr data-a="">'))
})

function assertText(t, e, msg) { assertEquals(t(), e, msg) }

// testing('h with fragment', { skip: true }, async test => {
  // await test('boolean fragment', () => assertText(h([true]), 'true'))
  // await test('string fragment', () => assertText(h(['A']), 'A'))
  // await test('number fragment', () => assertText(h([1]), '1'))
  // await test('bigint fragment', () => assertText(h([2n]), '2'))
  // await test('array fragment', () => assertText(h(p=>p.children,['A',1,2n]), 'A12'))
  // await test('array fragment', () => assertText(h(p=>p.children,['A',1,2n,()=>true]), 'A12'))
  // await test('signal fragment', () => assertText(h([()=>1]), '1'))
// })

testing('h with reactive content', async test => {
  await test('higher-order component', () => {
    const Hi = p => h('b',['Hi ',p.name]),
      name = signal('An'),
      t = h(Hi, {name:()=>name})()
    assertHTML(t,`<b>Hi An</b>`)
    name('Yi')
    assertHTML(t,`<b>Hi Yi</b>`)
  })
})

// testing('h with event handler', {skip:true}, async test => {
  //   const i = 0
  //   const t = h('button', {onclick:()=>i+=1})
  //   console.log(t())//.firstChild.dispatchEvent(new MouseEvent('click',{bubbles:true}))
  //   t().firstChild.dispatchEvent(new MouseEvent('click',{bubbles:true}))
  //   assertEquals(i, 1)
// })

//   describe("Components", () => {
//     const Comp = props => h("div", () => props.name + " " + props.middle, props.children);
//     S.root(() => {
//       const template = h("#main", [
//         h(Comp, { name: () => "John", middle: "R." }, () => h("span", "Smith"))
//       ])();
//       const div = document.createElement("div");
//       div.appendChild(template);
//       assertEquals(div.innerHTML,FIXTURES[4])
//     });
//   });

//   describe("Component Spread", () => {
//     const Comp = props => h("div", props);
//     S.root(() => {
//       const template = h("#main", [
//         h(Comp, { name: () => "John" }, () => h("span", "Smith"))
//       ])();
//       const div = document.createElement("div");
//       div.appendChild(template);
//       assertEquals(div.innerHTML,FIXTURES[5])
//     });
//   });
