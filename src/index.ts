import { createElement, CreateParams } from "./core/create"
import { fragment } from "./core/fragment"
import { text } from "./core/text"
import { signal, computed, effect, batch } from "./reactive/signal"
import type { Signal, WritableSignal } from "./reactive/signal"
import { router } from "./core/router"
import type { Router, Routes, RouterOptions } from "./core/router"

export type { CreateParams }
export type { Signal, WritableSignal }
export type { Router, Routes, RouterOptions }
export { signal, computed, effect, batch, router }

export type ElementType = {
  container: string | HTMLElement
  classNames?: string[]
}

function _Ciet<K extends keyof HTMLElementTagNameMap>(
  params: { element: K } & ElementType
): HTMLElementTagNameMap[K] {
  const container = typeof params.container === "string"
    ? document.getElementById(params.container) ?? document.body
    : params.container

  const el = document.createElement(params.element)
  container.appendChild(el)

  if (params.classNames) {
    params.classNames.forEach(className => {
      if (!className) return
      className.split(/\s+/).filter(Boolean).forEach(c => el.classList.add(c))
    })
  }

  return el
}

export const Ciet = Object.assign(_Ciet, {
  create: createElement,
  fragment,
  text,
  signal,
  computed,
  effect,
  batch,
  router,

  div: (params: CreateParams = {}): HTMLDivElement =>
    createElement("div", params),

  button: (params: CreateParams & { clickEvent?: () => void } = {}): HTMLButtonElement => {
    const btn = createElement("button", params)
    if (params.clickEvent) {
      btn.addEventListener("click", params.clickEvent)
    }
    return btn
  },

  a: (params: CreateParams & { href?: string; target?: "_blank" } = {}): HTMLAnchorElement => {
    const a = createElement("a", params) as HTMLAnchorElement
    a.href = params.href && !/^\s*javascript\s*:/i.test(params.href) ? params.href : "#"
    if (params.target) a.target = params.target
    return a
  },
})

export default Ciet
