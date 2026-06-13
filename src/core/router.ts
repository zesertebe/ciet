import { createElement, CreateParams } from "./create"

// --- Public types ---

export type GuardContext = {
  from: string
  to: string
  params: Record<string, string>
}

export type GuardFn = (ctx: GuardContext) => boolean | string

export type RouteComponent = (params: Record<string, string>) => HTMLElement | void

export type GuardedRouteConfig = {
  component: RouteComponent
  beforeEnter?: GuardFn | GuardFn[]
}

export type RouteEntry = RouteComponent | GuardedRouteConfig

export type Routes = Record<string, RouteEntry>

export type RouterOptions = {
  outlet?: string | HTMLElement
  fallback?: RouteComponent
  beforeEach?: GuardFn | GuardFn[]
}

export type Router = {
  navigate(path: string): void
  go(delta: number): void
  readonly current: string
  destroy(): void
  link(params: CreateParams & { to: string }): HTMLAnchorElement
}

// --- Internal types ---

type GuardList = GuardFn[]
type NormalizedEntry = {
  path: string
  regex: RegExp
  paramNames: string[]
  component: RouteComponent
  beforeEnter: GuardList
}

// --- Helpers ---

function resolveOutlet(outlet?: string | HTMLElement): HTMLElement {
  if (!outlet) return document.body
  if (typeof outlet === "string") {
    const id = outlet.startsWith("#") ? outlet.slice(1) : outlet
    return document.getElementById(id) ?? document.body
  }
  return outlet
}

function toGuardList(guards?: GuardFn | GuardFn[]): GuardList {
  if (!guards) return []
  return Array.isArray(guards) ? guards : [guards]
}

function runGuards(guards: GuardList, ctx: GuardContext): boolean | string {
  for (const guard of guards) {
    const result = guard(ctx)
    if (result !== true) return result
  }
  return true
}

function makeRegex(path: string, paramNames: string[]): RegExp {
  return new RegExp(
    "^" +
      path
        .replace(/:(\w+)/g, (_, name) => {
          paramNames.push(name)
          return "([^/]+)"
        })
        .replace(/\//g, "\\/") +
      "$"
  )
}

function parseParams(match: RegExpMatchArray, paramNames: string[]): Record<string, string> {
  const params: Record<string, string> = {}
  paramNames.forEach((name, i) => {
    params[name] = decodeURIComponent(match[i + 1])
  })
  return params
}

function cleanHash(path: string): string {
  return path.replace(/^#/, "") || "/"
}

export function router(routes: Routes, options: RouterOptions = {}): Router {
  const outlet = resolveOutlet(options.outlet)
  const globalGuards = toGuardList(options.beforeEach)

  const entries: NormalizedEntry[] = Object.entries(routes).map(([path, entry]) => {
    const paramNames: string[] = []
    const regex = makeRegex(path, paramNames)
    if (typeof entry === "function") {
      return { path, component: entry, regex, paramNames, beforeEnter: [] }
    }
    return {
      path,
      component: entry.component,
      regex,
      paramNames,
      beforeEnter: toGuardList(entry.beforeEnter),
    }
  })

  let currentPath = cleanHash(window.location.hash)
  let isNavigating = false
  let redirectCount = 0
  const MAX_REDIRECTS = 10

  function findEntry(path: string): { entry: NormalizedEntry; params: Record<string, string> } | null {
    for (const entry of entries) {
      const match = path.match(entry.regex)
      if (match) {
        return { entry, params: parseParams(match, entry.paramNames) }
      }
    }
    return null
  }

  function runAllGuards(path: string): boolean | string {
    const matched = findEntry(path)
    const ctx: GuardContext = {
      from: currentPath,
      to: path,
      params: matched?.params ?? {},
    }

    const globalResult = runGuards(globalGuards, ctx)
    if (globalResult !== true) return globalResult

    if (matched) {
      const routeResult = runGuards(matched.entry.beforeEnter, ctx)
      if (routeResult !== true) return routeResult
    }

    return true
  }

  function render(path: string) {
    currentPath = path

    for (const entry of entries) {
      const match = path.match(entry.regex)
      if (match) {
        const params = parseParams(match, entry.paramNames)
        const content = entry.component(params)
        while (outlet.firstChild) outlet.removeChild(outlet.firstChild)
        if (content) outlet.appendChild(content)
        return
      }
    }

    if (options.fallback) {
      const content = options.fallback({})
      while (outlet.firstChild) outlet.removeChild(outlet.firstChild)
      if (content) outlet.appendChild(content)
    }
  }

  function navigate(path: string): void {
    if (redirectCount >= MAX_REDIRECTS) {
      console.error(
        `[ciet router] Redirect limit (${MAX_REDIRECTS}) reached for "${path}". ` +
        "Check for circular guards."
      )
      redirectCount = 0
      return
    }

    const result = runAllGuards(path)

    if (result === false) return

    if (typeof result === "string") {
      redirectCount++
      navigate(result)
      return
    }

    redirectCount = 0
    isNavigating = true
    window.location.hash = path
  }

  function onHashChange() {
    const path = cleanHash(window.location.hash)

    if (isNavigating) {
      isNavigating = false
      render(path)
      return
    }

    const result = runAllGuards(path)

    if (result === false) {
      history.replaceState(null, "", `#${currentPath}`)
      return
    }

    if (typeof result === "string") {
      history.replaceState(null, "", `#${result}`)
      render(result)
      return
    }

    render(path)
  }

  // --- Initialization ---

  window.addEventListener("hashchange", onHashChange)

  ;(function init() {
    const path = cleanHash(window.location.hash)
    const result = runAllGuards(path)

    if (result === false) {
      if (options.fallback) {
        const content = options.fallback({})
        while (outlet.firstChild) outlet.removeChild(outlet.firstChild)
        if (content) outlet.appendChild(content)
      }
      currentPath = path
      return
    }

    if (typeof result === "string") {
      history.replaceState(null, "", `#${result}`)
      render(result)
      return
    }

    render(path)
  })()

  return {
    navigate,
    go: (delta: number) => window.history.go(delta),
    get current() {
      return currentPath
    },
    destroy: () => {
      window.removeEventListener("hashchange", onHashChange)
    },
    link: (params: CreateParams & { to: string }): HTMLAnchorElement => {
      const a = createElement("a", params) as HTMLAnchorElement
      a.href = `#${params.to}`
      a.addEventListener("click", (e) => {
        e.preventDefault()
        navigate(params.to)
      })
      return a
    },
  }
}
