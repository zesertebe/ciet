import { createElement, CreateParams } from "./create"

export type RouteComponent = (params: Record<string, string>) => HTMLElement | void

export type Routes = Record<string, RouteComponent>

export type RouterOptions = {
  outlet?: string | HTMLElement
  fallback?: RouteComponent
}

export type Router = {
  navigate(path: string): void
  go(delta: number): void
  readonly current: string
  destroy(): void
  link(params: CreateParams & { to: string }): HTMLAnchorElement
}

function resolveOutlet(outlet?: string | HTMLElement): HTMLElement {
  if (!outlet) return document.body
  if (typeof outlet === "string") {
    return document.getElementById(outlet) ?? document.body
  }
  return outlet
}

export function router(routes: Routes, options: RouterOptions = {}): Router {
  const outlet = resolveOutlet(options.outlet)

  const entries = Object.entries(routes).map(([path, component]) => {
    const paramNames: string[] = []
    const regex = new RegExp(
      "^" +
        path
          .replace(/:(\w+)/g, (_, name) => {
            paramNames.push(name)
            return "([^/]+)"
          })
          .replace(/\//g, "\\/") +
        "$"
    )
    return { path, component, regex, paramNames }
  })

  function render(path: string) {
    for (const entry of entries) {
      const match = path.match(entry.regex)
      if (match) {
        const params: Record<string, string> = {}
        entry.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1])
        })
        const content = entry.component(params)

        while (outlet.firstChild) {
          outlet.removeChild(outlet.firstChild)
        }
        if (content) {
          outlet.appendChild(content)
        }
        return
      }
    }

    if (options.fallback) {
      const content = options.fallback({})
      while (outlet.firstChild) {
        outlet.removeChild(outlet.firstChild)
      }
      if (content) {
        outlet.appendChild(content)
      }
    }
  }

  function navigate(path: string) {
    window.location.hash = path
  }

  function onHashChange() {
    render(window.location.hash.slice(1) || "/")
  }

  window.addEventListener("hashchange", onHashChange)

  render(window.location.hash.slice(1) || "/")

  return {
    navigate,
    go: (delta: number) => window.history.go(delta),
    get current() {
      return window.location.hash.slice(1) || "/"
    },
    destroy: () => {
      window.removeEventListener("hashchange", onHashChange)
    },
    link: (params: CreateParams & { to: string }): HTMLAnchorElement => {
      const a = createElement("a", params) as HTMLAnchorElement
      a.href = `#${params.to}`
      return a
    },
  }
}
