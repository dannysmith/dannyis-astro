/**
 * Phase 1 prototype for reader margin annotations. Throwaway: it exists to
 * answer the experiment's questions, not to become the component.
 *
 * Seeds a few annotations onto the scratchpad article, lays them out in the right
 * gutter (or inline beneath their blocks when narrow), and lets you add more by
 * selecting text. Behaviour is driven by `data-annot-*` attributes on <html>,
 * which the lab panel on the scratchpad page sets. No persistence.
 */
import { inkArrow } from './ink-arrow'

interface Annotation {
  mark: HTMLElement
  note: HTMLElement
  text: HTMLElement
  block: Element
}

// Direct prose children only — never inside MDX components.
const BLOCKS =
  ':scope > p, :scope > blockquote, :scope > :is(h2, h3, h4), :scope > :is(ul, ol) > li'
const NOTE_GAP = 20
const SVG_NS = 'http://www.w3.org/2000/svg'

const SEEDS = [
  { quote: 'I made a video platform', note: 'Since when?!' },
  { quote: 'picked away at a lot of little bits and pieces', note: 'Understatement of the year' },
  {
    quote: 'first-class citizens',
    note: 'This is what makes them feel native rather than embedded',
  },
  { quote: 'JSON endpoint', note: 'Same trick for exporting notes?' },
  { quote: 'tabular numerals', note: 'Check these in dark mode' },
  { quote: 'only served if footnotes are present', note: 'Do this for annotations too' },
  { quote: 'This has bugged me for ages', note: 'Me too' },
]

export function init() {
  const root = document.documentElement
  const prose = document.querySelector<HTMLElement>('.longform-prose')
  const margin = prose?.querySelector<HTMLElement>(':scope > .annot-margin')
  const ink = margin?.querySelector<SVGSVGElement>('.annot-ink')
  if (!prose || !margin || !ink) return

  const annotations: Annotation[] = []
  let nextRef = 1
  const wide = matchMedia('(min-width: 1400px)')
  const blocks = () => Array.from(prose.querySelectorAll(BLOCKS))

  const layoutMode = () => {
    const forced = root.dataset.annotMode
    if (forced === 'margin' || forced === 'inline') return forced
    return wide.matches ? 'margin' : 'inline'
  }

  function add(range: Range, block: Element, noteText: string): Annotation {
    const ref = String(nextRef++)

    const mark = document.createElement('span')
    mark.className = 'annot-mark'
    mark.dataset.ref = ref
    mark.append(range.extractContents())
    range.insertNode(mark)

    const note = document.createElement('span')
    note.className = 'annot-note'
    note.dataset.ref = ref
    note.setAttribute('role', 'note')

    const text = document.createElement('span')
    text.className = 'annot-note-text'
    text.contentEditable = 'plaintext-only'
    text.textContent = noteText
    text.addEventListener('input', scheduleLayout)
    text.addEventListener('blur', () => {
      if (!text.textContent?.trim()) remove(annotation)
    })
    note.append(text)

    const annotation = { mark, note, text, block }
    annotations.push(annotation)
    return annotation
  }

  function remove(annotation: Annotation) {
    annotation.mark.replaceWith(...annotation.mark.childNodes)
    annotation.note.remove()
    annotations.splice(annotations.indexOf(annotation), 1)
    scheduleLayout()
  }

  // ---- Layout ----------------------------------------------------------------

  function layout() {
    const mode = layoutMode()
    root.dataset.annotLayout = mode
    ink!.replaceChildren()

    const ordered = annotations.toSorted((a, b) =>
      a.mark.compareDocumentPosition(b.mark) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    )

    // Only ever move a note that is in the wrong place. Moving a node blurs a
    // focused contenteditable inside it and drops the caret, so re-parenting
    // every note on every layout makes a note impossible to type into.
    if (mode === 'inline') {
      // Beneath the block (or its whole list), stacking in order when a block has several.
      const lastInserted = new Map<Element, Element>()
      for (const a of ordered) {
        a.note.style.removeProperty('top')
        const anchor = a.block.matches('li') ? (a.block.parentElement ?? a.block) : a.block
        const after = lastInserted.get(anchor) ?? anchor
        if (after.nextElementSibling !== a.note) after.after(a.note)
        lastInserted.set(anchor, a.note)
      }
      return
    }

    // Margin notes are absolutely positioned, so DOM order doesn't matter here.
    for (const a of ordered) if (a.note.parentElement !== margin) margin!.append(a.note)

    const frame = margin!.getBoundingClientRect()
    const weight = Number(root.dataset.annotWeight ?? 1)
    let cursor = 0

    for (const a of ordered) {
      // Align the note's first line with the first line of its mark, then push
      // it down past the previous note if they'd collide.
      const markLine = a.mark.getClientRects()[0]
      const noteLineHeight = parseFloat(getComputedStyle(a.note).lineHeight)
      const wanted = markLine.top - frame.top + markLine.height / 2 - noteLineHeight / 2
      const top = Math.max(0, wanted, cursor)
      a.note.style.top = `${top}px`
      cursor = top + a.note.offsetHeight + NOTE_GAP

      const noteBox = a.note.getBoundingClientRect()
      const arrow = inkArrow(
        { x: noteBox.left - frame.left - 8, y: top + noteLineHeight / 2 },
        { x: 8, y: markLine.top - frame.top + markLine.height / 2 },
        weight,
      )
      ink!.append(path('annot-shaft', arrow.shaft), path('annot-head', arrow.head))
    }
  }

  let frameRequest: number | undefined
  function scheduleLayout() {
    frameRequest ??= requestAnimationFrame(() => {
      frameRequest = undefined
      layout()
    })
  }

  // ---- Selection → "Write in margin" -----------------------------------------

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'annot-write'
  button.textContent = 'Write in margin'
  button.hidden = true
  document.body.append(button)

  const blockFor = (node: Node) => {
    const element = node instanceof Element ? node : node.parentElement
    const block = element?.closest('p, blockquote, h2, h3, h4, li')
    return block && blocks().includes(block) ? block : undefined
  }

  function pendingSelection() {
    const selection = getSelection()
    if (!selection || selection.rangeCount !== 1 || selection.isCollapsed) return
    const range = selection.getRangeAt(0)
    const block = blockFor(range.startContainer)
    if (!block || block !== blockFor(range.endContainer) || !range.toString().trim()) return
    if (annotations.some(a => range.intersectsNode(a.mark))) return
    return { range: range.cloneRange(), block }
  }

  let buttonShown = false
  function onSelectionChange() {
    const pending = pendingSelection()
    if (!pending) {
      button.hidden = true
      return
    }
    const rect = pending.range.getClientRects()[pending.range.getClientRects().length - 1]
    button.hidden = false
    const { offsetWidth: w, offsetHeight: h } = button
    const below = rect.bottom + 8
    const top = below + h <= innerHeight - 8 ? below : rect.top - h - 8
    button.style.top = `${Math.max(8, Math.min(top, innerHeight - h - 8))}px`
    button.style.left = `${Math.max(8, Math.min(rect.right, innerWidth - w - 8))}px`
    if (!buttonShown) {
      buttonShown = true
      performance.mark('annot:button-shown')
    }
  }

  button.addEventListener('pointerdown', event => event.preventDefault())
  button.addEventListener('click', () => {
    const pending = pendingSelection()
    if (!pending) return
    const annotation = add(pending.range, pending.block, '')
    getSelection()?.removeAllRanges()
    button.hidden = true
    layout()
    annotation.text.focus()
  })
  document.addEventListener('selectionchange', onSelectionChange)
  addEventListener('scroll', () => (button.hidden = true), { passive: true })

  // ---- Boot ------------------------------------------------------------------

  if (root.dataset.annotSeed !== '0') {
    for (const seed of SEEDS) {
      const block = blocks().find(b => b.textContent?.includes(seed.quote))
      const start = block?.textContent?.indexOf(seed.quote) ?? -1
      const range = block && rangeFromOffsets(block, start, start + seed.quote.length)
      if (block && range) add(range, block, seed.note)
      else console.warn(`[annot] seed not found: "${seed.quote}"`)
    }
  }

  // A lazy load is triggered by a selection, so handle the one already in progress.
  onSelectionChange()

  let lastSize = ''
  new ResizeObserver(([entry]) => {
    const size = `${Math.round(entry.contentRect.width)}x${Math.round(entry.contentRect.height)}`
    if (size === lastSize) return
    lastSize = size
    scheduleLayout()
  }).observe(prose)
  wide.addEventListener('change', scheduleLayout)
  document.addEventListener('annot:relayout', scheduleLayout)
  document.fonts.ready.then(scheduleLayout)
  layout()
}

/** Builds a Range spanning character offsets into `root`'s text content. */
function rangeFromOffsets(root: Node, start: number, end: number) {
  if (start < 0) return
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let position = 0
  let started = false
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = node.textContent?.length ?? 0
    if (!started && start < position + length) {
      range.setStart(node, start - position)
      started = true
    }
    if (started && end <= position + length) {
      range.setEnd(node, end - position)
      return range
    }
    position += length
  }
}

function path(className: string, d: string) {
  const element = document.createElementNS(SVG_NS, 'path')
  element.classList.add(className)
  element.setAttribute('d', d)
  return element
}
