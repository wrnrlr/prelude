/**
* Non-breakable space in Unicode
* @group Utils
*/
export const nbsp:string = '\u00A0'

export declare type Window = { document: Document;  SVGElement: typeof SVGElements}
// export declare type Elem = any
// declare type SVGElement = any
// declare type Document = any
// declare type ShadowRoot = any
// declare type DocumentFragment = any
// export declare type Node = any

// type ExpandableNode = Node & { [key: string]: unknown };

// type Expect<T extends true> = T;
// type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
// const test = {children:[] as any[]}
// type test1 = Expect<Equal<typeof test, ElementProps>>

const booleans:string[] = [
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'disabled',
  'formnovalidate',
  'hidden',
  'indeterminate',
  'inert',
  'ismap',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'seamless',
  'selected'
];

const BooleanAttributes:Set<string> = /*#__PURE__*/ new Set(booleans);

const Properties:Set<string> = /*#__PURE__*/ new Set([
  'className',
  'value',
  'readOnly',
  'formNoValidate',
  'isMap',
  'noModule',
  'playsInline',
  ...booleans
]);

const ChildProperties:Set<string> = /*#__PURE__*/ new Set([
  'innerHTML',
  'textContent',
  'innerText',
  'children'
]);

// React Compat
const Aliases:Record<string,string> = /*#__PURE__*/ Object.assign(Object.create(null), {
  className: 'class',
  htmlFor: 'for'
});

const PropAliases = /*#__PURE__*/ Object.assign(Object.create(null), {
  class: 'className',
  formnovalidate: {
    $: 'formNoValidate',
    BUTTON: 1,
    INPUT: 1
  },
  ismap: {
    $: 'isMap',
    IMG: 1
  },
  nomodule: {
    $: 'noModule',
    SCRIPT: 1
  },
  playsinline: {
    $: 'playsInline',
    VIDEO: 1
  },
  readonly: {
    $: 'readOnly',
    INPUT: 1,
    TEXTAREA: 1
  }
});

function getPropAlias(prop:string,tagName:string):string | undefined {
  const a = PropAliases[prop];
  return typeof a === 'object' ? (a[tagName] ? a['$'] : undefined) : a;
}

// list of Element events that will be delegated
const DelegatedEvents:Set<string> = /*#__PURE__*/ new Set([
  'beforeinput',
  'click',
  'dblclick',
  'contextmenu',
  'focusin',
  'focusout',
  'input',
  'keydown',
  'keyup',
  'mousedown',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'pointerdown',
  'pointermove',
  'pointerout',
  'pointerover',
  'pointerup',
  'touchend',
  'touchmove',
  'touchstart'
]);

const SVGElements:Set<string> = /*#__PURE__*/ new Set([
  // 'a',
  'altGlyph',
  'altGlyphDef',
  'altGlyphItem',
  'animate',
  'animateColor',
  'animateMotion',
  'animateTransform',
  'circle',
  'clipPath',
  'color-profile',
  'cursor',
  'defs',
  'desc',
  'ellipse',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feDropShadow',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',
  'filter',
  'font',
  'font-face',
  'font-face-format',
  'font-face-name',
  'font-face-src',
  'font-face-uri',
  'foreignObject',
  'g',
  'glyph',
  'glyphRef',
  'hkern',
  'image',
  'line',
  'linearGradient',
  'marker',
  'mask',
  'metadata',
  'missing-glyph',
  'mpath',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'radialGradient',
  'rect',
  // 'script',
  'set',
  'stop',
  // 'style',
  'svg',
  'switch',
  'symbol',
  'text',
  'textPath',
  // 'title',
  'tref',
  'tspan',
  'use',
  'view',
  'vkern'
]);

const SVGNamespace:Record<string,string> = {
  xlink: 'http://www.w3.org/1999/xlink',
  xml: 'http://www.w3.org/XML/1998/namespace'
};

const DOMElements:Set<string> = /*#__PURE__*/ new Set([
  'html',
  'base',
  'head',
  'link',
  'meta',
  'style',
  'title',
  'body',
  'address',
  'article',
  'aside',
  'footer',
  'header',
  'main',
  'nav',
  'section',
  'body',
  'blockquote',
  'dd',
  'div',
  'dl',
  'dt',
  'figcaption',
  'figure',
  'hr',
  'li',
  'ol',
  'p',
  'pre',
  'ul',
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'br',
  'cite',
  'code',
  'data',
  'dfn',
  'em',
  'i',
  'kbd',
  'mark',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var',
  'wbr',
  'area',
  'audio',
  'img',
  'map',
  'track',
  'video',
  'embed',
  'iframe',
  'object',
  'param',
  'picture',
  'portal',
  'source',
  'svg',
  'math',
  'canvas',
  'noscript',
  'script',
  'del',
  'ins',
  'caption',
  'col',
  'colgroup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'button',
  'datalist',
  'fieldset',
  'form',
  'input',
  'label',
  'legend',
  'meter',
  'optgroup',
  'option',
  'output',
  'progress',
  'select',
  'textarea',
  'details',
  'dialog',
  'menu',
  'summary',
  'details',
  'slot',
  'template',
  'content',
  'frame',
  'hgroup',
  'image',
  'menuitem',
  'plaintext',
  'rb',
  'rtc',
  'shadow',
  'spacer',
  'strike',
  'tt',
  'xmp',
  'a',
  'abbr',
  'acronym',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'content',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'image',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'picture',
  'portal',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  'samp',
  'script',
  'section',
  'select',
  'shadow',
  'slot',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'template',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'video',
  'wbr',
  'input',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6'
]);

export const SelfClosingTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', 'command', 'keygen', 'menuitem', 'frame'])

export const DepricatedTags = new Set([
  'acronym',
  'applet',
  'basefont',
  'bgsound',
  'big',
  'blink',
  'center',
  'dir',
  'font',
  'frameset',
  'keygen',
  'marquee',
  'nobr',
  'noembed',
  'noframes',
  'applet',
  'basefont',
  'bgsound',
  'big',
  'blink',
  'center',
  'dir',
  'embed',
  'font',
  'frame',
  'frameset',
  'keygen',
  'marquee',
  'menu',
  'menuitem',
  'nobr',
  'noembed',
  'noframes',
  'param',
  'plaintext',
  'rb',
  'rtc',
  's',
  'spacer',
  'strike',
  'tt',
  'var',
  'xmp'
])

// data-*
// anchor (experimental, not standard)
// virtualkeyboardpolicyExperimental

export const GlobalAttributes = [
  'src',
  'id',
  'class',
  'style',
  'title',
  'lang',
  'dir',
  'hidden',
  'tabindex',
  'accesskey',
  'contenteditable',
  'spellcheck',
  'draggable',
  'translate',
] as const

export const AllAttributes = [
  'accesskey',
  'autocapitalize',
  'autocorrect',
  'autofocus',
  'class',
  'contenteditable',
  'dir',
  'draggable',
  'enterkeyhint',
  'exportparts',
  'hidden',
  'id',
  'inert',
  'inputmode',
  'is',
  'itemid',
  'itemprop',
  'itemref',
  'itemscope',
  'itemtype',
  'lang',
  'nonce',
  'part',
  'popover',
  'slot',
  'spellcheck',
  'style',
  'tabindex',
  'title',
  'translate',
  'writingsuggestions',
]

export {
  BooleanAttributes,
  Properties,
  ChildProperties,
  getPropAlias,
  Aliases,
  DelegatedEvents,
  SVGElements,
  SVGNamespace,
  DOMElements
};
