import { describe, it, expect, vi, afterEach } from 'vitest'
import { z } from 'astro/zod'
import type { LoaderContext } from 'astro/loaders'
import { getConfig } from '@config/config'
import {
  fetchWithRetry,
  listRecords,
  getRecord,
  rkeyOf,
  blobUrl,
  type PdsRecord,
} from '@utils/atproto/pds'
import { atprotoLoader } from '@utils/atproto/loader'
import { atprotoImage } from '@utils/atproto/image'
import { detectChanges, fingerprint, watched, type StateManifest } from '@utils/atproto/changes'
import { mirrorImage } from '@utils/mirrorImage'

vi.mock('@utils/mirrorImage', () => ({ mirrorImage: vi.fn(async () => null) }))

const NSID = 'test.example.thing'
const REPO = { did: 'did:plc:example', host: 'pds.test' }

const record = (rkey: string, value: Record<string, unknown> = {}, cid = `cid-${rkey}`) =>
  ({ uri: `at://${REPO.did}/${NSID}/${rkey}`, cid, value }) satisfies PdsRecord

const page = (records: PdsRecord[], cursor?: string) => Response.json({ records, cursor })

/** Serve the given responses in order, and remember what was asked for. */
function serve(...responses: (Response | Error)[]) {
  const fetch = vi.fn(async (_url: string) => {
    const next = responses.shift()
    if (!next) throw new Error('unexpected request')
    if (next instanceof Error) throw next
    return next
  })
  vi.stubGlobal('fetch', fetch)
  return { urls: () => fetch.mock.calls.map(([url]) => new URL(url)), fetch }
}

const collect = async (records: AsyncIterable<PdsRecord>) => {
  const all: PdsRecord[] = []
  for await (const r of records) all.push(r)
  return all
}

afterEach(() => vi.unstubAllGlobals())

describe('fetchWithRetry', () => {
  it('retries a 500 and returns the success that follows', async () => {
    const { fetch } = serve(new Response('blip', { status: 500 }), new Response('ok'))

    const response = await fetchWithRetry('https://pds.test/x', { delayMs: 0 })

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('returns a genuine 4xx at once, without retrying', async () => {
    const { fetch } = serve(new Response('no such thing', { status: 404 }))

    const response = await fetchWithRetry('https://pds.test/x', { delayMs: 0 })

    expect(response.status).toBe(404)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('retries a network error, and throws it once the attempts run out', async () => {
    const down = new Error('other side closed')
    const { fetch } = serve(down, down, down)

    await expect(fetchWithRetry('https://pds.test/x', { attempts: 3, delayMs: 0 })).rejects.toBe(
      down,
    )
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})

describe('listRecords', () => {
  const fullPage = Array.from({ length: 100 }, (_, i) => record(`r${i}`))

  it('follows the cursor, and stops on a short page even when that page has a cursor too', async () => {
    const { urls } = serve(page(fullPage, 'r99'), page([record('last')], 'last'))

    const records = await collect(listRecords(NSID, REPO))

    expect(records).toHaveLength(101)
    const [first, second] = urls()
    expect(first.host).toBe('pds.test')
    expect(Object.fromEntries(first.searchParams)).toEqual({
      repo: REPO.did,
      collection: NSID,
      limit: '100',
    })
    expect(second.searchParams.get('cursor')).toBe('r99')
    expect(urls()).toHaveLength(2)
  })

  it('throws when a page fails, rather than yielding part of a collection as if it were all', async () => {
    serve(page(fullPage, 'r99'), new Response('nope', { status: 400 }))

    await expect(collect(listRecords(NSID, REPO))).rejects.toThrow(/returned 400/)
  })

  it('stops at the limit, asking each page for no more than it still needs', async () => {
    const rest = Array.from({ length: 50 }, (_, i) => record(`s${i}`))
    const { urls } = serve(page(fullPage, 'r99'), page(rest, 's49'))

    const records = await collect(listRecords(NSID, REPO, { limit: 150 }))

    expect(records).toHaveLength(150)
    expect(urls().map(url => url.searchParams.get('limit'))).toEqual(['100', '50'])
  })

  it('is a single request for the newest record when the limit is one', async () => {
    const { urls } = serve(page([record('newest')], 'newest'))

    const records = await collect(listRecords(NSID, REPO, { limit: 1 }))

    expect(records.map(r => rkeyOf(r.uri))).toEqual(['newest'])
    expect(urls()).toHaveLength(1)
    expect(urls()[0].searchParams.get('limit')).toBe('1')
  })
})

describe('getRecord', () => {
  it('fetches one record by key', async () => {
    const { urls } = serve(Response.json(record('one', { title: 'One' })))

    const found = await getRecord(NSID, 'one', REPO)

    expect(found?.value).toEqual({ title: 'One' })
    expect(Object.fromEntries(urls()[0].searchParams)).toEqual({
      repo: REPO.did,
      collection: NSID,
      rkey: 'one',
    })
  })

  it('is null for a record that does not exist, which the PDS reports as a 400', async () => {
    serve(Response.json({ error: 'RecordNotFound' }, { status: 400 }))

    expect(await getRecord(NSID, 'gone', REPO)).toBeNull()
  })

  it('throws on any other failure, rather than passing it off as an absence', async () => {
    serve(Response.json({ error: 'InvalidRequest' }, { status: 400 }))

    await expect(getRecord(NSID, 'one', REPO)).rejects.toThrow(/returned 400/)
  })
})

describe('blobUrl', () => {
  it('builds the getBlob URL for a blob CID', () => {
    const url = new URL(blobUrl('bafkreiexample', REPO))
    expect(url.origin + url.pathname).toBe('https://pds.test/xrpc/com.atproto.sync.getBlob')
    expect(Object.fromEntries(url.searchParams)).toEqual({ did: REPO.did, cid: 'bafkreiexample' })
  })
})

describe('fingerprint', () => {
  const a = { rkey: 'a', cid: 'cid-a' }
  const b = { rkey: 'b', cid: 'cid-b' }

  it('ignores order, since the PDS and the content store need not agree on one', () => {
    expect(fingerprint([a, b])).toBe(fingerprint([b, a]))
  })

  it('moves on a create, an edit and a delete', () => {
    const before = fingerprint([a, b])
    expect(fingerprint([a, b, { rkey: 'c', cid: 'cid-c' }])).not.toBe(before)
    expect(fingerprint([a, { rkey: 'b', cid: 'cid-b-edited' }])).not.toBe(before)
    expect(fingerprint([a])).not.toBe(before)
  })
})

describe('watched', () => {
  const a = { rkey: 'a', cid: 'cid-a' }
  const b = { rkey: 'b', cid: 'cid-b' }

  it('is every record for a digest', () => {
    expect(watched('digest', [a, b])).toEqual([a, b])
  })

  it('is only the record with the greatest rkey for latest, whatever the order', () => {
    expect(watched('latest', [a, b])).toEqual([b])
    expect(watched('latest', [b, a])).toEqual([b])
    expect(watched('latest', [])).toEqual([])
  })
})

describe('atprotoLoader', () => {
  /** Just enough of Astro's loader context: a store, a schema and a logger. */
  function context(existing: { id: string; data: unknown; digest?: string }[] = []) {
    const entries = new Map(existing.map(entry => [entry.id, entry]))
    const schema = z.object({ title: z.string() })
    const logger = { info: vi.fn(), warn: vi.fn() }
    const loaderContext = {
      store: {
        set: (entry: { id: string; data: unknown; digest?: string }) =>
          entries.set(entry.id, entry),
        delete: (id: string) => entries.delete(id),
        keys: () => [...entries.keys()],
      },
      parseData: async ({ data }: { data: unknown }) => schema.parse(data),
      logger,
    } as unknown as LoaderContext
    return {
      entries,
      logger,
      load: (limit?: number) => atprotoLoader({ nsid: NSID, limit }).load(loaderContext),
    }
  }

  it('loads only the newest records when given a limit, and drops older entries', async () => {
    const { urls } = serve(page([record('new', { title: 'New' })], 'new'))
    const { entries, load } = context([{ id: 'old', data: { title: 'Old' } }])

    await load(1)

    expect([...entries.keys()]).toEqual(['new'])
    expect(urls()).toHaveLength(1)
    expect(urls()[0].searchParams.get('limit')).toBe('1')
  })

  it('stores each record under its rkey, parsed, with the CID as its digest', async () => {
    serve(page([record('one', { title: 'One', extra: 'dropped' }, 'bafy-one')]))
    const { entries, load } = context()

    await load()

    expect([...entries.values()]).toEqual([
      { id: 'one', data: { title: 'One' }, digest: 'bafy-one' },
    ])
  })

  it('reads from the repo and host in the site config', async () => {
    const { urls } = serve(page([]))

    await context().load()

    const { did, pdsHost } = getConfig().atproto
    expect(urls()[0].host).toBe(pdsHost)
    expect(urls()[0].searchParams.get('repo')).toBe(did)
  })

  it('removes entries whose records have been deleted upstream', async () => {
    serve(page([record('kept', { title: 'Kept' })]))
    const { entries, load } = context([{ id: 'gone', data: { title: 'Gone' } }])

    await load()

    expect([...entries.keys()]).toEqual(['kept'])
  })

  it('keeps the last build’s entries, and warns, when the collection cannot be read', async () => {
    serve(new Response('no', { status: 400 }))
    const { entries, logger, load } = context([{ id: 'old', data: { title: 'Old' } }])

    await expect(load()).resolves.toBeUndefined()

    expect([...entries.keys()]).toEqual(['old'])
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Keeping the 1 entries'))
  })

  it('skips a record that does not fit the schema, and loads the rest', async () => {
    serve(page([record('good', { title: 'Good' }), record('bad', { title: 42 })]))
    const { entries, logger, load } = context()

    await load()

    expect([...entries.keys()]).toEqual(['good'])
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining(`${NSID}/bad`))
  })
})

describe('atprotoImage', () => {
  const options = { group: 'books', maxPx: 400 }
  const mirrored = () => vi.mocked(mirrorImage).mock.lastCall

  it('mirrors a blob from its getBlob URL on the configured PDS', async () => {
    const blob = {
      $type: 'blob' as const,
      ref: { $link: 'bafkreicover' },
      mimeType: 'image/jpeg',
      size: 1,
    }

    await atprotoImage(blob, options)

    const { did, pdsHost: host } = getConfig().atproto
    expect(mirrored()?.[0]).toBe(blobUrl('bafkreicover', { did, host }))
    expect(mirrored()?.[1]).toMatchObject(options)
  })

  it('fetches a blob from another repo when told to', async () => {
    const blob = {
      $type: 'blob' as const,
      ref: { $link: 'bafkreiother' },
      mimeType: 'image/jpeg',
      size: 1,
    }

    await atprotoImage(blob, { ...options, repo: REPO })

    expect(mirrored()?.[0]).toBe(blobUrl('bafkreiother', REPO))
  })

  it('mirrors a plain URL as it is', async () => {
    await atprotoImage('https://cdn.example/art.jpg', options)

    expect(mirrored()?.[0]).toBe('https://cdn.example/art.jpg')
  })

  it('is null for a record with no image, without touching the mirror', async () => {
    vi.mocked(mirrorImage).mockClear()

    expect(await atprotoImage(undefined, options)).toBeNull()
    expect(mirrorImage).not.toHaveBeenCalled()
  })
})

describe('detectChanges', () => {
  const MANIFEST_URL = 'https://site.test/atproto-state.json'
  const built = [record('a'), record('b')]

  /** The manifest a build would have published, having loaded `records`. */
  const manifest = (records: PdsRecord[], watch: 'digest' | 'latest' = 'digest') =>
    Response.json({
      version: 1,
      ...REPO,
      builtAt: '2026-09-18T10:00:00.000Z',
      sources: [
        {
          nsid: NSID,
          watch,
          fingerprint: fingerprint(
            watched(
              watch,
              records.map(r => ({ rkey: rkeyOf(r.uri), cid: r.cid })),
            ),
          ),
          count: records.length,
        },
      ],
    } satisfies StateManifest)

  it('asks for only the newest record of a latest source, and is satisfied by it', async () => {
    const { urls } = serve(manifest(built, 'latest'), page([record('b')], 'b'))

    expect(await detectChanges(MANIFEST_URL)).toEqual({
      changed: false,
      reason: 'nothing has changed',
    })
    expect(urls()).toHaveLength(2)
    expect(urls()[1].searchParams.get('limit')).toBe('1')
  })

  it('reports a change to a latest source when a newer record has appeared', async () => {
    serve(manifest(built, 'latest'), page([record('c')], 'c'))

    expect(await detectChanges(MANIFEST_URL)).toMatchObject({
      changed: true,
      changedSources: [NSID],
    })
  })

  it('reads the manifest, then the repo and host it names', async () => {
    const { urls } = serve(manifest(built), page(built))

    await detectChanges(MANIFEST_URL)

    const [first, second] = urls()
    expect(first.href).toBe(MANIFEST_URL)
    expect(second.host).toBe(REPO.host)
    expect(second.searchParams.get('repo')).toBe(REPO.did)
    expect(second.searchParams.get('collection')).toBe(NSID)
  })

  it('reports no change when the PDS still holds what the build loaded', async () => {
    serve(manifest(built), page([...built].reverse()))

    expect(await detectChanges(MANIFEST_URL)).toEqual({
      changed: false,
      reason: 'nothing has changed',
    })
  })

  it('reports a change when a record has been edited in place', async () => {
    serve(manifest(built), page([record('a'), record('b', {}, 'cid-b-edited')]))

    expect(await detectChanges(MANIFEST_URL)).toEqual({
      changed: true,
      changedSources: [NSID],
      state: expect.stringMatching(/^[0-9a-f]{12}$/),
      builtAt: '2026-09-18T10:00:00.000Z',
    })
  })

  it('names the same PDS state the same way every time, and a different one differently', async () => {
    const stateOf = async (now: PdsRecord[]) => {
      serve(manifest(built), page(now))
      const result = await detectChanges(MANIFEST_URL)
      return result.changed ? result.state : null
    }

    const created = [...built, record('c')]
    expect(await stateOf(created)).toBe(await stateOf(created))
    expect(await stateOf(created)).not.toBe(await stateOf([record('a')]))
  })

  it.each([
    ['there is no manifest yet', [new Response('not found', { status: 404 })], /returned 404/],
    ['the manifest is not JSON', [new Response('<html>')], /could not be read/],
    ['the manifest is some other shape', [Response.json({ version: 2 })], /shape/],
    ['a collection cannot be read', [manifest(built), new Response('no', { status: 400 })], NSID],
  ])('does not ask for a rebuild when %s', async (_case, responses, why) => {
    serve(...responses)

    const result = await detectChanges(MANIFEST_URL)

    expect(result.changed).toBe(false)
    expect(result).toHaveProperty('reason', expect.stringMatching(why))
  })
})
