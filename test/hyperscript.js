import {runtime} from '../src/runtime.ts'
import {hyperscript} from '../src/hyperscript.ts'
import {JSDOM} from 'npm:jsdom'

describe("hyperscript", () => {
  const FIXTURES = [
    '<div id="main"><h1>Hi</h1><span style="color: rgb(85, 85, 85);">555</span><label for="entry" class="name">Edit:</label><input id="entry" type="text" readonly=""></div>',
    '<div id="main" refset="true" class="selected"><h1 title="hello" style="background-color: red;"><a href="/daft/public">Welcome</a></h1></div>',
    '<div id="main"><button>Click Bound</button><button>Click Delegated</button><button>Click Listener</button></div>',
    '<div>First</div>middle<div>Last</div>',
    '<div id="main"><div>John R.<span>Smith</span></div></div>',
    '<div id="main"><div name="John"><span>Smith</span></div></div>',
    '<div id="main"><div class="a b"></div></div>'
  ];

  const {window} = new JSDOM('<!DOCTYPE html>');
  const {document,MouseEvent} = window
  const r = runtime(window)
  const h = hyperscript(r);

  describe("Simple Elements", () => {
    const template = h("#main", [
      h("h1", "Hi"),
      h("span", { style: "color: #555" }, 555),
      h("label.name", { htmlFor: "entry" }, "Edit:"),
      h("input#entry", { type: "text", readonly: true })
    ])();
    assertEquals(template.outerHTML,FIXTURES[0])
  });

  describe("Reactive Content", () => {
    const name = signal('Alice')
    const template = h("div", ["Hello ",name]);
    assertEquals(template().outerHTML,`<div>Hello Alice</div>`)
    name('Bob')
    assertEquals(template().outerHTML,`<div>Hello Bob</div>`)
  });

  describe("Component without props or children", () => {
    assertEquals(h('hr')().outerHTML,`<hr>`)
  });

  describe("Element with single child ", () => {
    const name = signal('Bob')
    assertEquals(h('b',[name])().outerHTML,`<b>Bob</b>`)
    assertEquals(h('b',[()=>name])().outerHTML,`<b>Bob</b>`)
    assertEquals(h('b',name())().outerHTML,`<b>Bob</b>`)
    // assertEquals(h('b',()=>name())().outerHTML,`<b>Bob</b>`)
  });

  // describe("Custom Component", () => {
  //   function Greeting(props) {
  //     return h("div", ["Hello ",props.name]);
  //   }
  //   const name = signal('Alice')
  //   const template = h(Greeting, {name:'Alice'});
  //   assertEquals(template()(),`<div>Hello Alice</div>`)
  //   name('Bob')
  //   assertEquals(template().outerHTML,`<div>Hello Bob</div>`)
  // });


//   describe("Attribute Expressions", () => {
//     const selected = signal(true),
//       welcoming = signal("hello");
//     let link;

//     S.root(() => {
//       const template = h( "#main", {
//           classList: () => ({ selected: selected() }),
//           ref: el => {el.setAttribute("refset", "true");}
//         },
//         h("h1",{title: welcoming,style: () => ({ "background-color": "red" })},
//           h("a", { href: "/", ref: r => (link = r) }, "Welcome")
//         )
//       )();
//       assertEquals(template.outerHTML,FIXTURES[1])
//     });
//   });

//   describe("Event Expressions", () => {
//     const exec = {};

//     const template = h("#main", [
//       h("button", { onclick: () => (exec.bound = true) }, "Click Bound"),
//       h("button", { onClick: () => (exec.delegated = true) }, "Click Delegated"),
//       h("button", { "on:click": () => (exec.listener = true) }, "Click Listener")
//     ])();
//     assertEquals(template.outerHTML,FIXTURES[2])
//     document.body.appendChild(template);
//     let event = new MouseEvent("click", { bubbles: true });
//     template.firstChild.dispatchEvent(event);
//     event = new MouseEvent("click", { bubbles: true });
//     template.firstChild.nextSibling.dispatchEvent(event);
//     event = new MouseEvent("click", { bubbles: true });
//     template.firstChild.nextSibling.nextSibling.dispatchEvent(event);

//     assert(exec.bound)
//     assert(exec.delegated)
//     assert(exec.listener)
//     document.body.textContent = "";
//     r.clearDelegatedEvents();
//   });

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