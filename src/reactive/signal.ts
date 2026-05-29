export type Signal<T> = {
  readonly value: T
  peek(): T
  subscribe(fn: () => void): () => void
}

export type WritableSignal<T> = Signal<T> & {
  value: T
}

let activeEffect: (() => void) | null = null
let activeDeps: Set<Set<() => void>> | null = null
let batchDepth = 0
const pendingEffects = new Set<() => void>()

export function signal<T>(initial: T): WritableSignal<T> {
  let _value = initial
  const subs = new Set<() => void>()

  const self: WritableSignal<T> = {
    get value(): T {
      if (activeEffect && activeDeps) {
        subs.add(activeEffect)
        activeDeps.add(subs)
      }
      return _value
    },
    set value(v: T) {
      if (v !== _value) {
        _value = v
        if (batchDepth > 0) {
          subs.forEach(fn => pendingEffects.add(fn))
        } else {
          ;[...subs].forEach(fn => fn())
        }
      }
    },
    peek(): T {
      return _value
    },
    subscribe(fn: () => void): () => void {
      subs.add(fn)
      return () => { subs.delete(fn) }
    },
  }

  return self
}

export function effect(fn: () => void): () => void {
  let running = false
  let deps = new Set<Set<() => void>>()

  const run = () => {
    if (running) return
    running = true

    for (const d of deps) d.delete(run)
    deps.clear()

    const prevEffect = activeEffect
    const prevDeps = activeDeps
    activeEffect = run
    activeDeps = deps

    try {
      fn()
    } finally {
      activeEffect = prevEffect
      activeDeps = prevDeps
      running = false
    }
  }

  run()

  return () => {
    for (const d of deps) d.delete(run)
    deps.clear()
  }
}

export function computed<T>(fn: () => T): Signal<T> {
  const s = signal(undefined as unknown as T)

  effect(() => {
    s.value = fn()
  })

  return {
    get value(): T {
      return s.value
    },
    peek(): T {
      return s.peek()
    },
    subscribe(fn: () => void): () => void {
      return s.subscribe(fn)
    },
  }
}

export function batch(fn: () => void): void {
  batchDepth++
  try {
    fn()
  } finally {
    batchDepth--
    if (batchDepth === 0) {
      const toRun = [...pendingEffects]
      pendingEffects.clear()
      toRun.forEach(fn => fn())
    }
  }
}
