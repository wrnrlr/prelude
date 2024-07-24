import {assertEquals,assert} from '@std/assert'
import {describe,it} from '@std/testing/bdd'
import {createHyperScript} from "./h.js";
import {spread, assign, insert, createComponent, dynamicProperty, SVGElements} from "./dom.js";
import S from "./s.ts";

import {JSDOM} from 'npm:jsdom'
const {window} = new JSDOM('<!DOCTYPE html>');

function createRuntime(window) {
  const {document} = window,
    isSVG = e => e instanceof window.SVGElement,
    createElement = name => SVGElements.has(name) ? document.createElementNS("http://www.w3.org/2000/svg",name) : document.createElement(name),
    createTextNode = s => document.createTextNode(s)
  function archetype(a) {
    let t = typeof a
    if (t==='object') {
      if (Array.isArray(a)) t = 'array'
      else if (a instanceof RegExp) t = 'regexp'
      else if (a instanceof Date) t = 'date'
      else if (a instanceof window.Element) t = 'element'
    }
    return t
  }
  return {archetype,assign,insert,spread,dynamicProperty,createComponent,createElement,createTextNode,isSVG}
}

const r = createRuntime(window)
const h = createHyperScript(r);

const FIXTURES = [
  '<div id="main"><h1>Welcome</h1><span style="color: rgb(85, 85, 85);">555</span><label for="entry" class="name">Edit:</label><input id="entry" type="text" readonly=""></div>',
  '<div id="main" refset="true" class="selected"><h1 title="hello" style="background-color: red;"><a href="/">Welcome</a></h1></div>',
  '<div id="main"><button>Click Bound</button><button>Click Delegated</button><button>Click Listener</button></div>',
  '<div>First</div>middle<div>Last</div>',
  '<div id="main"><div>John R.<span>Smith</span></div></div>',
  '<div id="main"><div name="John"><span>Smith</span></div></div>',
  '<div id="main"><div class="a b"></div></div>'
];

describe("HyperScript", () => {
  describe("Simple Elements", {only:true}, () => {
    const template = h("#main", [
      h("h1", "Welcome"),
      h("span", { style: "color: #555" }, 555),
      h("label.name", { htmlFor: "entry" }, "Edit:"),
      h("input#entry", { type: "text", readonly: true })
    ])();
    assertEquals(template.outerHTML,FIXTURES[0])
  });

  describe("Attribute Expressions", () => {
    console.log('data:',S.data)
    const selected = S.data(true),
      welcoming = S.data("hello");
    let link;

    S.root(() => {
      const template = h( "#main", {
          classList: () => ({ selected: selected() }),
          ref: el => {el.setAttribute("refset", "true");}
        },
        h("h1",{title: welcoming,style: () => ({ "background-color": "red" })},
          h("a", { href: "/", ref: r => (link = r) }, "Welcome")
        )
      )();
      assertEquals(template.outerHTML,FIXTURES[1])
    });
  });

  describe("Event Expressions", () => {
    const exec = {};

    const template = h("#main", [
      h("button", { onclick: () => (exec.bound = true) }, "Click Bound"),
      h("button", { onClick: () => (exec.delegated = true) }, "Click Delegated"),
      h("button", { "on:click": () => (exec.listener = true) }, "Click Listener")
    ])();
    assertEquals(template.outerHTML,FIXTURES[2])
    document.body.appendChild(template);
    let event = new MouseEvent("click", { bubbles: true });
    template.firstChild.dispatchEvent(event);
    event = new MouseEvent("click", { bubbles: true });
    template.firstChild.nextSibling.dispatchEvent(event);
    event = new MouseEvent("click", { bubbles: true });
    template.firstChild.nextSibling.nextSibling.dispatchEvent(event);

    assert(exec.bound)
    assert(exec.delegated)
    assert(exec.listener)
    document.body.textContent = "";
    r.clearDelegatedEvents();
  });

  describe("Fragments", () => {
    const inserted = S.data("middle");

    S.root(() => {
      const template = h([h("div", "First"), inserted, h("div", "Last")]);
      const div = document.createElement("div");
      r.insert(div, template);
      assertEquals(div.innerHTML,FIXTURES[3])
    });
  });

  describe("Components", () => {
    const Comp = props => h("div", () => props.name + " " + props.middle, props.children);
    S.root(() => {
      const template = h("#main", [
        h(Comp, { name: () => "John", middle: "R." }, () => h("span", "Smith"))
      ])();
      const div = document.createElement("div");
      div.appendChild(template);
      assertEquals(div.innerHTML,FIXTURES[4])
    });
  });

  describe("Component Spread", () => {
    const Comp = props => h("div", props);
    S.root(() => {
      const template = h("#main", [
        h(Comp, { name: () => "John" }, () => h("span", "Smith"))
      ])();
      const div = document.createElement("div");
      div.appendChild(template);
      assertEquals(div.innerHTML,FIXTURES[5])
    });
  });

  describe("Class Spread", () => {
    S.root(() => {
      const template = h("#main", [
        h("div.a", {class:'b'})
      ])();
      const div = document.createElement("div");
      div.appendChild(template);
      assertEquals(div.innerHTML,FIXTURES[6])
    });
  });
});
