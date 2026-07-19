/**
 * Client-side Pagefind search helper — the typed API the command palette talks
 * to, so components never touch Pagefind's untyped runtime directly.
 *
 * Responsibilities:
 *   • Lazy-load + init Pagefind's browser runtime once, on first use.
 *   • Debounce searches and normalize `.data()` into a stable `SearchResult`.
 *   • Degrade gracefully: with no built index (e.g. `bun run dev` with no prior
 *     build) it reports `unavailable` instead of throwing.
 *
 * The index is generated at build time by src/lib/pagefind-integration.mjs.
 */

/** A single normalized search hit — the shape the palette renders. */
export interface SearchResult {
  url: string
  /** From `data-pagefind-meta="title"` / the page `<h1>`. */
  title: string
  /** From `data-pagefind-meta="type:…"` — `article` | `note` | `page`. */
  type: string
  /** HTML excerpt with `<mark>` around matches (our own content — safe to render). */
  excerpt: string
  /** `YYYY-MM-DD` from `data-pagefind-meta="date:…"`; absent on undated pages. */
  date?: string
  /** Auto-captured thumbnail (first body image / og-image), if any. */
  image?: string
  imageAlt?: string
}

/**
 * Outcome of a {@link search} call. Distinguishes the three real states the UI
 * cares about: results returned, this call was superseded by a newer keystroke,
 * or Pagefind isn't available (no index built).
 */
export type SearchOutcome =
  | { status: 'ok'; results: SearchResult[]; total: number }
  | { status: 'superseded' }
  | { status: 'unavailable' }

export interface SearchOptions {
  /** Max results to fetch full data for (default 8). */
  limit?: number
  /** Debounce window in ms (default 200). */
  debounceMs?: number
}

// --- Minimal typing for the generated Pagefind runtime (ships no types) ---

interface PagefindData {
  url: string
  excerpt: string
  meta: Record<string, string | undefined> & {
    title?: string
    type?: string
    date?: string
    image?: string
    image_alt?: string
  }
}

interface PagefindSearchResponse {
  results: Array<{ data(): Promise<PagefindData> }>
}

interface PagefindRuntime {
  init(): Promise<void>
  search(query: string, options?: Record<string, unknown>): Promise<PagefindSearchResponse>
  debouncedSearch(
    query: string,
    options?: Record<string, unknown>,
    debounceMs?: number,
  ): Promise<PagefindSearchResponse | null>
  preload(query: string, options?: Record<string, unknown>): Promise<void>
}

let runtime: Promise<PagefindRuntime | null> | null = null

/**
 * Load + init Pagefind's runtime once (memoized). Resolves to `null` when there's
 * no built index, and resets so a later call can retry (e.g. dev after a build).
 *
 * The import path is computed (not a static string) so neither Vite's dev-server
 * import analysis nor the rollup build tries to resolve `/pagefind/pagefind.js` —
 * it only exists in the built output. `BASE_URL` is `/`.
 */
function loadPagefind(): Promise<PagefindRuntime | null> {
  if (!runtime) {
    runtime = (async () => {
      try {
        const url = `${import.meta.env.BASE_URL}pagefind/pagefind.js`
        const mod = (await import(/* @vite-ignore */ url)) as PagefindRuntime
        await mod.init()
        return mod
      } catch {
        runtime = null // allow a retry on the next call
        return null
      }
    })()
  }
  return runtime
}

/** Warm the runtime (and optionally an index shard) ahead of the first query. */
export function preloadPagefind(term = ''): void {
  void loadPagefind().then(pf => pf?.preload(term))
}

/** Map Pagefind's raw `.data()` into a stable {@link SearchResult}. Exported for tests. */
export function normalize(d: PagefindData): SearchResult {
  return {
    url: d.url,
    title: d.meta.title ?? d.url,
    type: d.meta.type ?? 'page',
    excerpt: d.excerpt,
    date: d.meta.date,
    image: d.meta.image,
    imageAlt: d.meta.image_alt,
  }
}

/**
 * Run a debounced search and return normalized results. An empty query yields an
 * empty `ok` result (no request). See {@link SearchOutcome} for the states.
 */
export async function search(query: string, options: SearchOptions = {}): Promise<SearchOutcome> {
  const { limit = 8, debounceMs = 200 } = options

  if (query.trim() === '') return { status: 'ok', results: [], total: 0 }

  const pf = await loadPagefind()
  if (!pf) return { status: 'unavailable' }

  try {
    const response = await pf.debouncedSearch(query, {}, debounceMs)
    if (response === null) return { status: 'superseded' }

    // `response.results` holds a lightweight handle for *every* match; we only pull
    // `.data()` for the top `limit`, but the full length is the true result count.
    const top = await Promise.all(response.results.slice(0, limit).map(r => r.data()))
    return { status: 'ok', results: top.map(normalize), total: response.results.length }
  } catch {
    // A query or fragment fetch rejected (e.g. a transient network failure). The
    // palette calls this without awaiting, so swallow it into the outcome contract
    // rather than let an unhandled rejection escape.
    return { status: 'unavailable' }
  }
}
