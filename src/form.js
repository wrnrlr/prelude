import { signal, memo, effect, context, useContext, renderEffect } from './reactive.ts'
import { Show } from './show.ts'
import { List } from './list.ts'
import { h } from './hyperscript.ts'
import { nbsp } from './constants.ts'

const Ctx = context()
const useForm = () => useContext(Ctx)

export function Form(props) {
  return h('form', h(Ctx.Provider, {value:[props.value]}, props.children))
}

export function Input(props) {
  props.onInput = ((e) => props.value((e?.target)?.value))
  props.autocomplete = props.autocomplete || 'off'
  // const onInput = ((e) => props.value((e?.target)?.value))
  if (props.autosize) props.ref = (r) => props.autosize(r, props)
  return h('input', props)
}

export function autosize(r, props) {
  const style = globalThis.getComputedStyle(r)
  renderEffect(() => {
    const font = style.getPropertyValue('font')
    const metrics = fontMetrics(font, props.value().toString())
    r.style.width = metrics.width + 'px'
  })
}

let _fontMetricsCtx

function fontMetrics(font, text) {
  if (!_fontMetricsCtx) _fontMetricsCtx = document.createElement('canvas').getContext('2d')
  _fontMetricsCtx.font = font;
  return _fontMetricsCtx.measureText(text)
}

export function Checkbox(props) {
  return h('input',{
    ...props,
    type:'checkbox',
    checked:props.value,
    onInput:e => props.value(e.target.checked)
  })
}

export function Select(props) {
  // const description = wrap(props.value,'description')
  const show = signal(false)
  const selected = memo(()=>{
    const options = typeof props.options === 'function' ? props.options() : props.options || []
    return {options}
  })
  const fallback = props.placeholder ? h('span', props.placeholder) : 'nbsp'
  return h('.select', [
    h('button', {onClick:e=>show(s=>!s)},
      h(Show, {when:()=>props.value, fallback}, ()=>props.value() || nbsp)),
    h(Show, {when: show}, h('.options', {style:'position:absolute'}, h(List, {each:()=>selected().options},
      (option) => h('.option', {
        onClick: (e) => { e.preventDefault(); props.value(option()); show(false) },
        class: () => props.value()===option() ? 'selected' : '',
        style: 'cursor: pointer'
      }, option)
    )))
  ])
}

const DialogCtx = context(null)
export const useDialog = () => useContext(DialogCtx)

export function Dialog(props) {
  let dialog
  const close = () => dialog.close()
  const show = props.modal ? () => dialog.showModal() : () =>  dialog.show()
  return h('dialog', {
    ref(dia) {
      dialog = dia
      const closeHandler = (_) =>  props.show(false)
      effect(() => props.show() && show())
      dialog.addEventListener('close', closeHandler)
      if (props.ref) props.ref(dialog)
      return () => dialog.removeEventListener('close', closeHandler)
    }
  }, h(DialogCtx, {value:()=>[{close:close}]}, props.children))
}

function CurrencyInput(props) {
  return h(Input, props)
}

export function Button(props) {
  let checked
  return h('button', {}, props.children)
}
