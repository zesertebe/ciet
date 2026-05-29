export type CSSPropValue = string | number | null | undefined

export type CreateParams = {
  container?: string | HTMLElement
  class?: string
  id?: string
  style?: Record<string, CSSPropValue>
  attrs?: Record<string, string | number | boolean | null | undefined>
  dataset?: Record<string, string | number | boolean | null | undefined>
  events?: Record<string, EventListenerOrEventListenerObject | null | undefined>
  text?: string
  html?: string
  children?: Node[]
  classNames?: string[]
  onMount?: (el: HTMLElement) => void
  onUnmount?: (el: HTMLElement) => void
}

function setClasses(el: HTMLElement, classStr: string, classNames?: string[]): void {
  const tokens: string[] = []

  if (classStr) {
    classStr.split(/\s+/).filter(Boolean).forEach(c => tokens.push(c))
  }

  if (classNames) {
    classNames.forEach(cn => {
      if (!cn) return
      cn.split(/\s+/).filter(Boolean).forEach(c => tokens.push(c))
    })
  }

  tokens.forEach(c => el.classList.add(c))
}

function setStyles(el: HTMLElement, style: Record<string, CSSPropValue>): void {
  for (const key of Object.keys(style)) {
    const value = style[key]
    if (value === null || value === undefined) continue
    (el.style as any)[key] = String(value)
  }
}

function setAttrs(el: HTMLElement, attrs: Record<string, string | number | boolean | null | undefined>): void {
  for (const key of Object.keys(attrs)) {
    const value = attrs[key]
    if (value === null || value === undefined) continue
    if (value === false) continue
    if (value === true) {
      el.setAttribute(key, "")
    } else {
      el.setAttribute(key, String(value))
    }
  }
}

function setDataset(el: HTMLElement, dataset: Record<string, string | number | boolean | null | undefined>): void {
  for (const key of Object.keys(dataset)) {
    const value = dataset[key]
    if (value === null || value === undefined) continue
    el.dataset[key] = String(value)
  }
}

function bindEvents(el: HTMLElement, events: Record<string, EventListenerOrEventListenerObject | null | undefined>): void {
  for (const key of Object.keys(events)) {
    const handler = events[key]
    if (!handler) continue
    el.addEventListener(key, handler)
  }
}

function appendChildren(el: HTMLElement, children: Node[]): void {
  for (const child of children) {
    el.appendChild(child)
  }
}

function resolveContainer(container?: string | HTMLElement): HTMLElement | null {
  if (!container) return null
  if (typeof container === "string") {
    return document.getElementById(container) ?? document.body
  }
  return container
}

function observeUnmount(el: HTMLElement, container: HTMLElement, onUnmount: (el: HTMLElement) => void): void {
  const observer = new MutationObserver(() => {
    if (!document.contains(el)) {
      onUnmount(el)
      observer.disconnect()
    }
  })
  observer.observe(container, { childList: true, subtree: true })
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  params: CreateParams = {}
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)

  if (params.id) el.id = params.id
  if (params.class || params.classNames) setClasses(el, params.class ?? "", params.classNames)
  if (params.style) setStyles(el, params.style)
  if (params.attrs) setAttrs(el, params.attrs)
  if (params.dataset) setDataset(el, params.dataset)
  if (params.events) bindEvents(el, params.events)
  if (params.text) el.textContent = params.text
  if (params.html) el.innerHTML = params.html
  if (params.children) appendChildren(el, params.children)

  const container = resolveContainer(params.container)
  if (container) {
    container.appendChild(el)
    if (params.onMount) params.onMount(el)
    if (params.onUnmount) observeUnmount(el, container, params.onUnmount)
  }

  return el
}
