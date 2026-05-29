export function fragment(children: Node[] = []): DocumentFragment {
  const frag = document.createDocumentFragment()
  for (const child of children) {
    if (child) frag.appendChild(child)
  }
  return frag
}
