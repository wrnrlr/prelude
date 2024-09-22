/**
@group Components
*/
export function Input(props) {
  const fallback = "fallback" in props && { fallback: () => props.fallback }
  return memo(listArray(() => props.each, props.children, fallback || undefined))
}

/**
@group Components
*/
export function Table(props) {
  const fallback = "fallback" in props && { fallback: () => props.fallback }
  return memo(listArray(() => props.each, props.children, fallback || undefined))
}

/**
@group Components
*/
export function Canvas(props) {
  const fallback = "fallback" in props && { fallback: () => props.fallback }
  return memo(listArray(() => props.each, props.children, fallback || undefined))
}
