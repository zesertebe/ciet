# ciet

**ciet** es una librería ligera en TypeScript para crear componentes HTML sin escribir HTML. Solo JavaScript/TypeScript.
~1 KB gzipped, cero dependencias, sin VDOM (manipulación directa del DOM real).

## Instalación

```bash
npm install @zesertebe/ciet
```

## Import

```typescript
// ES module (bundlers: webpack, vite, etc.)
import Ciet from "@zesertebe/ciet"
const { signal, computed, effect } = Ciet

// O con destructuring directo si tu bundler lo soporta:
import Ciet, { signal, computed, effect, batch, router } from "@zesertebe/ciet"

// CommonJS (Node.js)
const Ciet = require("@zesertebe/ciet")

// Script tag directo (UMD global)
// <script src="node_modules/@zesertebe/ciet/dist/content.js"></script>
// window.Ciet ya está disponible
```

## Uso básico

```typescript
import Ciet from "@zesertebe/ciet"

const div = Ciet.div({ container: "app", classNames: ["container"] })
div.textContent = "¡Hola mundo!"
```

## API

---

### `Ciet.create(tag, params)`

Crea cualquier elemento HTML con atributos, estilos, eventos e hijos en una sola llamada.

| Parámetro   | Tipo                                  | Descripción                                              |
|-------------|---------------------------------------|----------------------------------------------------------|
| `tag`       | `keyof HTMLElementTagNameMap`          | Etiqueta HTML (`"div"`, `"button"`, `"a"`, `"span"`, etc.) |
| `container` | `string \| HTMLElement` *(opcional)*   | ID del contenedor o elemento. Si se omite, no se appendea. |
| `class`     | `string` *(opcional)*                  | Clases CSS separadas por espacios: `"btn primary"`        |
| `id`        | `string` *(opcional)*                  | ID del elemento                                           |
| `style`     | `Record<string, string \| number>` *(opcional)* | Estilos en camelCase: `{ backgroundColor: "blue", padding: "8px" }` |
| `attrs`     | `Record<string, string \| number \| boolean>` *(opcional)* | Atributos HTML: `{ type: "submit", disabled: true }` |
| `dataset`   | `Record<string, string>` *(opcional)*  | Data attributes: `{ userId: "123" }` → `data-user-id`     |
| `events`    | `Record<string, function>` *(opcional)* | Event listeners: `{ click: handler, mouseenter: handler }` |
| `text`      | `string` *(opcional)*                  | `textContent` del elemento                                |
| `html`      | `string` *(opcional)*                  | `innerHTML` del elemento (usar con precaución)            |
| `children`  | `Node[]` *(opcional)*                  | Elementos hijos para anidar                               |
| `onMount`   | `(el: HTMLElement) => void` *(opcional)* | Se ejecuta cuando el elemento se monta en el DOM        |
| `onUnmount` | `(el: HTMLElement) => void` *(opcional)* | Se ejecuta cuando el elemento se remueve del DOM        |

**Retorna:** El elemento creado, tipado según `tag`.

> `onMount` se dispara inmediatamente después de `appendChild`.  
> `onUnmount` usa un `MutationObserver` en el contenedor y se dispara cuando el elemento deja de estar en el `document`. Requiere `container`.

```typescript
const btn = Ciet.create("button", {
  container: "#app",
  class: "btn primary",
  id: "submit-btn",
  style: { backgroundColor: "blue", padding: "8px 16px", borderRadius: "4px" },
  attrs: { type: "submit", disabled: false },
  dataset: { userId: "42" },
  events: { click: () => console.log("Clicked!") },
  text: "Enviar",
})
```

---

### `Ciet(params)` — Backward compatible

Crea un elemento y lo appendea al contenedor (API original).

| Parámetro   | Tipo                              | Descripción                                         |
|-------------|-----------------------------------|-----------------------------------------------------|
| `element`   | `keyof HTMLElementTagNameMap`     | Etiqueta HTML (`"div"`, `"button"`, `"a"`, etc.)   |
| `container` | `string \| HTMLElement`           | ID del contenedor o elemento. Default: `document.body` |
| `classNames`| `string[]` *(opcional)*           | Clases CSS. Soporta strings con espacios.           |

```typescript
const span = Ciet({ element: "span", container: "root", classNames: ["text-sm"] })
```

---

### `Ciet.div(params)`

Crea un `<div>`. Retorna `HTMLDivElement`.

```typescript
const card = Ciet.div({ class: "card shadow", text: "Contenido" })
```

---

### `Ciet.button(params)`

Crea un `<button>`. Acepta `clickEvent` como callback. Retorna `HTMLButtonElement`.

```typescript
const btn = Ciet.button({
  class: "btn-primary",
  text: "Click me",
  clickEvent: () => console.log("Clicked!"),
})
```

---

### `Ciet.a(params)`

Crea un `<a>`. El `href` es sanitizado (bloquea protocolo `javascript:`). Retorna `HTMLAnchorElement`.

```typescript
const link = Ciet.a({
  class: "link",
  href: "https://example.com",
  target: "_blank",
  text: "Visitar",
})
```

---

### `Ciet.fragment(children)`

Crea un `DocumentFragment` para batch appends (evita reflows del DOM).

```typescript
const items = ["A", "B", "C"].map(text =>
  Ciet.create("li", { text })
)
const list = Ciet.create("ul", {
  children: [Ciet.fragment(items)]
})
```

---

### `Ciet.text(content)`

Crea un nodo de texto (`Text`).

```typescript
Ciet.create("p", {
  children: [
    Ciet.text("Texto antes de "),
    Ciet.create("strong", { text: "esto" }),
  ]
})
```

---

### `Ciet.router(routes, options?)`

Crea un router SPA con navegación hash-based. Detecta `hashchange` y renderiza el componente correspondiente en el `outlet`.

| Parámetro      | Tipo                          | Descripción                                      |
|---------------|-------------------------------|--------------------------------------------------|
| `routes`      | `Routes` | Mapa de ruta → componente o config con guards. `:param` para params dinámicos. |
| `options.outlet` | `string \| HTMLElement` *(opcional)* | Contenedor donde se renderiza. Default: `document.body`. Acepta `"#app"` o `"app"`. |
| `options.fallback` | `RouteComponent` *(opcional)* | Componente para rutas no encontradas (404).      |
| `options.beforeEach` | `GuardFn \| GuardFn[]` *(opcional)* | Guardia(s) global(es) que se ejecutan antes de cada navegación. |

**Retorna:** `Router` con métodos:

| Método         | Descripción                                    |
|---------------|------------------------------------------------|
| `.navigate(path)` | Navega a una ruta. Ej: `router.navigate("/about")`. Respeta guards. |
| `.go(delta)`  | Navega en el historial: `router.go(-1)` (atrás) |
| `.current`    | Ruta actual (getter) — última ruta renderizada exitosamente |
| `.destroy()`  | Limpia el listener de hashchange               |
| `.link(params)` | Crea un `<a>` que navega con el router (integrado con guards) |

```typescript
const router = Ciet.router({
  "/": () => Ciet.create("h1", { text: "Inicio" }),
  "/about": () => Ciet.create("h1", { text: "Acerca" }),
  "/users/:id": (params) => Ciet.create("h1", { text: `Usuario ${params.id}` }),
}, {
  outlet: "#app",
  fallback: () => Ciet.create("h1", { text: "404" }),
})

// Navegación programática
router.navigate("/about")

// Link con el router
router.link({ to: "/about", text: "Acerca" })
```

#### Guards de navegación (`GuardFn`)

Los guards permiten controlar el acceso a las rutas mediante funciones que se ejecutan antes de navegar.

```typescript
type GuardContext = {
  from: string                       // ruta actual
  to: string                         // ruta destino
  params: Record<string, string>     // parámetros de la ruta destino
}

type GuardFn = (ctx: GuardContext) => boolean | string
// true  → permite la navegación
// false → bloquea (no hace nada, se queda donde está)
// string → redirige a esa ruta
```

**Orden de ejecución:**

1. `beforeEach` (global, en orden si es array)
2. `beforeEnter` de la ruta destino (en orden si es array)

Si cualquiera retorna `false` o un `string` (redirect), se detiene la cadena y no se ejecuta el componente.

**Uso con ruta protegida:**

```typescript
// Ruta sin guard (componente directo)
"/": HomePage,

// Ruta con guard (config object)
"/profile": {
  component: ProfilePage,
  beforeEnter: [
    (ctx) => isLoggedIn.value ? true : "/login",
  ],
},

// Múltiples guards
"/admin": {
  component: AdminPage,
  beforeEnter: [
    (ctx) => isLoggedIn.value ? true : "/login",
    (ctx) => userRole.value === "admin" ? true : false,
  ],
},
```

**Guardia global:**

```typescript
const router = Ciet.router(routes, {
  outlet: "#app",
  fallback: NotFoundPage,
  beforeEach: [
    (ctx) => {
      console.log(`${ctx.from} → ${ctx.to}`)
      return true
    },
  ],
})
```

Los guards capturan **todos** los tipos de navegación:
- `router.navigate(path)` — programática
- `router.link()` — clics en links del router
- Botones de retroceso/avance del navegador
- Cambio manual del hash en la URL
- Carga inicial de la página con un hash directo (bookmarks)

## Reactividad

### `Ciet.signal(initialValue)`

Crea un valor reactivo. Cuando cambia, todos los efectos que lo leen se actualizan automáticamente.

| Método     | Descripción                                         |
|-----------|------------------------------------------------------|
| `.value`  | Getter/setter. Lee o escribe el valor actual.        |
| `.peek()` | Lee el valor sin crear suscripción.                  |
| `.subscribe(fn)` | Se suscribe manualmente a cambios. Retorna cleanup. |

```typescript
const count = Ciet.signal(0)
count.value              // → 0
count.value = 5          // actualiza y notifica
count.peek()             // → 5, sin suscribirse
const unsub = count.subscribe(() => console.log("cambió"))
```

### `Ciet.computed(fn)`

Deriva un valor reactivo a partir de otros signals/computed. Se recalcula automáticamente cuando sus dependencias cambian.

```typescript
const count = Ciet.signal(3)
const doubled = Ciet.computed(() => count.value * 2)
doubled.value  // → 6

count.value = 5
doubled.value  // → 10 (automático)
```

### `Ciet.effect(fn)`

Ejecuta `fn` inmediatamente y la re-ejecuta cada vez que cambia cualquier signal/computed que lea dentro. Retorna una función de limpieza.

```typescript
const name = Ciet.signal("Ana")

const cleanup = Ciet.effect(() => {
  console.log("Nombre:", name.value)
})
// Log: "Nombre: Ana"

name.value = "Bob"
// Log: "Nombre: Bob"

cleanup()  // deja de escuchar cambios
```

### `Ciet.batch(fn)`

Agrupa múltiples actualizaciones para que los efectos se ejecuten una sola vez al final.

```typescript
const a = Ciet.signal(1)
const b = Ciet.signal(2)

Ciet.effect(() => console.log(a.value + b.value))
// Log: 3

Ciet.batch(() => {
  a.value = 10
  b.value = 20
  // effect NO se ejecuta aquí
})
// Log: 30 (una sola vez al final del batch)
```

### Ciclo de vida

```typescript
const el = Ciet.create("div", {
  container: "#app",
  text: "Aparece y desaparece",
  style: { padding: "16px", background: "#ffeb3b" },
  onMount: (el) => console.log("✅ Montado:", el),
  onUnmount: (el) => console.log("🗑️ Removido:", el),
})

// onMount se dispara automáticamente aquí

// Cuando removemos el elemento:
document.getElementById("app")?.removeChild(el)
// → "🗑️ Removido:" se dispara automáticamente
```

### Ejemplo reactivo completo

```typescript
import Ciet from "@zesertebe/ciet"

// Estado
const count = Ciet.signal(0)
const doubled = Ciet.computed(() => count.value * 2)

// UI reactiva
const output = Ciet.create("span", { text: "0" })
const doubledOutput = Ciet.create("span", { text: "0" })

Ciet.effect(() => {
  output.textContent = String(count.value)
  doubledOutput.textContent = String(doubled.value)
})

Ciet.create("div", {
  class: "counter",
  children: [
    output,
    Ciet.create("br"),
    Ciet.create("em", { children: [Ciet.text("doble: "), doubledOutput] }),
    Ciet.create("br"),
    Ciet.button({
      text: "+1",
      clickEvent: () => count.value++,
    }),
    Ciet.button({
      text: "-1",
      clickEvent: () => count.value--,
    }),
  ],
  container: "#app",
})
```

## Ejemplos

```typescript
import Ciet from "@zesertebe/ciet"

// --- Tarjeta completa en una sola expresión ---
const card = Ciet.create("div", {
  class: "card",
  style: { border: "1px solid #ccc", padding: "16px", borderRadius: "8px" },
  children: [
    Ciet.create("h2", { class: "card-title", text: "Mi tarjeta" }),
    Ciet.create("p", { class: "card-body", text: "Descripción aquí" }),
    Ciet.create("div", {
      style: { display: "flex", gap: "8px", marginTop: "12px" },
      children: [
        Ciet.button({ class: "btn", text: "OK", clickEvent: () => alert("OK") }),
        Ciet.a({ class: "btn-link", href: "https://example.com", text: "Más info" }),
      ],
    }),
  ],
  container: "#app",
})

// --- Lista con fragment (batch) ---
const users = ["Ana", "Bob", "Carlos"]
const list = Ciet.create("ul", {
  children: [Ciet.fragment(users.map(name =>
    Ciet.create("li", { text: name })
  ))]
})
document.body.appendChild(list)
```

## Bundle size

| Módulo       | Tamaño (min+gzip) |
|-------------|-------------------|
| Core DOM (create + fragment + text + div/button/a + lifecycle) | ~1.2 KB |
| Reactividad (signal + computed + effect + batch) | ~1 KB |
| Router SPA (+ link helper) | ~0.5 KB |
| **Total**   | **~2.7 KB**       |

## Licencia

ISC
