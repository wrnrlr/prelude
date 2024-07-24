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
  'acronym',
  'applet',
  'basefont',
  'bgsound',
  'big',
  'blink',
  'center',
  'content',
  'dir',
  'font',
  'frame',
  'frameset',
  'hgroup',
  'image',
  'keygen',
  'marquee',
  'menuitem',
  'nobr',
  'noembed',
  'noframes',
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
  'applet',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'basefont',
  'bdi',
  'bdo',
  'bgsound',
  'big',
  'blink',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'center',
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
  'dir',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'font',
  'footer',
  'form',
  'frame',
  'frameset',
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
  'keygen',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'marquee',
  'menu',
  'menuitem',
  'meta',
  'meter',
  'nav',
  'nobr',
  'noembed',
  'noframes',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'param',
  'picture',
  'plaintext',
  'portal',
  'pre',
  'progress',
  'q',
  'rb',
  'rp',
  'rt',
  'rtc',
  'ruby',
  's',
  'samp',
  'script',
  'section',
  'select',
  'shadow',
  'slot',
  'small',
  'source',
  'spacer',
  'span',
  'strike',
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
  'tt',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
  'xmp',
  'input',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6'
]);

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
