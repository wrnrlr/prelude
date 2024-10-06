import {runtime} from '../src/runtime.ts'
import {hyperscript} from '../src/hyperscript.ts'
import {signal,root} from '../src/signal.ts'
import {JSDOM} from 'npm:jsdom'
import {assertEquals} from '@std/assert'

const {window} = new JSDOM('<!DOCTYPE html>')
const {document,MouseEvent} = window
const r = runtime(window), h = hyperscript(r)

function assertHTML(t, e, msg) { assertEquals(t().outerHTML, e, msg) }
function assertText(t, e, msg) { assertEquals(t().toString(), e, msg) }

Deno.test('h', async t => {

  function test(name, props, f = props) {
    let disposer
    return root(dispose => {
      disposer = () => {
        document.body.textContent = ''
        r.clearDelegatedEvents()
        dispose()
      }
      return t.step(name, f).then(disposer)
    })
  }

  // await Promise.all([
  //   await test('string content', () => assertHTML(h('b','A'), '<b>A</b>')),
  //   await test('string content', () => assertHTML(h('b','A'), '<b>A</b>'))
  // ])
  //

  // await test('blank tag', () => assertHTML(h(''), '<div></div>'))
  await test('tag with id', () => assertHTML(h('#a'), '<div id="a"></div>'))
  await test('tag with class', () => assertHTML(h('.a.b'), '<div class="a b"></div>'))
  await test('no props or children', () => assertHTML(h('hr'), '<hr>'))
  await test('string content', () => assertHTML(h('b','A'), '<b>A</b>'))
  await test("number content", () => assertHTML(h('i',1), '<i>1</i>'))
  await test("bigint content", () => assertHTML(h('i',2n), '<i>2</i>'))
  await test('array content', () => assertHTML(h('i',['A',1,2n]), '<i>A12</i>'))
  await test('signal content', () => {
    const n = signal('A'), t = h("b", n)
    assertHTML(t,`<b>A</b>`)
    n('B')
    assertHTML(t,`<b>B</b>`)
  })
  await test('string fragment', () => assertText(h(['A']), 'A'))
  await test("number fragment", () => assertText(h([1]), '1'))
  await test("bigint fragment", () => assertText(h([2n]), '2'))
  await test('style attribute', () => assertHTML(h('hr',{style:'color:#555'}), '<hr style="color: rgb(85, 85, 85);">'))
  await test('htmlFor attribute', () => assertHTML(h('label',{htmlFor:'a'}), '<label for="a"></label>'))
  await test('ref attribute', () => assertHTML(h('hr', {ref: el => el.setAttribute('refset', 'true')}),'<hr refset="true">'))
  await test('classList attribute', () => assertHTML(h('hr', {classList:()=>({selected:true})}), '<hr class="selected">'))

  await test("higher-order component", () => {
    const Hi = p => h('b',['Hi ',p.name]),
      name = signal('An'),
      t = h(Hi, {name:()=>name})()
    assertHTML(t,`<b>Hi An</b>`)
    name('Yi')
    assertHTML(t,`<b>Hi Yi</b>`)
  });

  // await test("onclick", () => {
  //   const i = 0
  //   console.log(h("button", {onclick:()=>i+=1})())//.firstChild.dispatchEvent(new MouseEvent('click',{bubbles:true}))
  //   assertEquals(i, 1)
  // })

  // await test("onClick", () => {
  //   const i = 0
  //     (h("button", {onClick:()=>i+=1})()).firstChild.dispatchEvent(new MouseEvent('click',{bubbles:true}))
  //   assertEquals(i, 1)
  // })

  // await test("on:click", () => {
  //   const i = 0
  //   h("button", {'on:click':()=>i+=1})().firstChild.dispatchEvent(new MouseEvent('click',{bubbles:true}))
  //   assertEquals(i, 1)
  // })

//   describe("Fragments", () => {
//     const inserted = signal("middle");

//     S.root(() => {
//       const template = h([h("div", "First"), inserted, h("div", "Last")]);
//       const div = document.createElement("div");
//       r.insert(div, template);
//       assertEquals(div.innerHTML,FIXTURES[3])
//     });
//   });

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

//   describe("Class Spread", () => {
//     S.root(() => {
//       const template = h("#main", [
//         h("div.a", {class:'b'})
//       ])();
//       const div = document.createElement("div");
//       div.appendChild(template);
//       assertEquals(div.innerHTML,FIXTURES[6])
//     });
//   });
});
