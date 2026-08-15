import { describe, it, expect } from 'vitest'
import { readHead } from '@utils/fetchLinkMetadata'
import { parseHead } from '@utils/deriveLinkMetadata'

describe('readHead', () => {
  /** A response whose body arrives in exactly these chunks. */
  function streamed(chunks: (string | Uint8Array)[], contentType = 'text/html'): Response {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(typeof chunk === 'string' ? encoder.encode(chunk) : chunk)
        }
        controller.close()
      },
    })
    return new Response(stream, { headers: { 'content-type': contentType } })
  }

  it('stops at </head> and drops the body', async () => {
    const html = '<head><title>Keep</title></head><body><h1>Discard</h1></body>'
    const head = await readHead(streamed([html]))
    expect(head).toContain('Keep')
    expect(head).not.toContain('Discard')
  })

  it('finds a </head> split across two chunks', async () => {
    const head = await readHead(streamed(['<head><title>Split</title></he', 'ad><body>no</body>']))
    expect(parseHead(head).title).toBe('Split')
    expect(head).not.toContain('body')
  })

  it('finds a </head> split one byte at a time', async () => {
    const html = '<head><title>Byte</title></head><body>no</body>'
    const head = await readHead(streamed([...html]))
    expect(parseHead(head).title).toBe('Byte')
    expect(head).not.toContain('body')
  })

  it('matches a closing tag in any case, with whitespace', async () => {
    const head = await readHead(streamed(['<head><title>Loud</title></HEAD  ><body>no</body>']))
    expect(parseHead(head).title).toBe('Loud')
    expect(head).not.toContain('body')
  })

  it('returns what it has when there is no </head> at all', async () => {
    const head = await readHead(streamed(['<title>Unclosed</title><p>rest of page</p>']))
    expect(parseHead(head).title).toBe('Unclosed')
  })

  it('decodes a non-UTF-8 body using the Content-Type charset', async () => {
    // windows-1252 0x92 is a right single quote; as UTF-8 it is invalid.
    const bytes = new Uint8Array([
      ...new TextEncoder().encode('<title>It'),
      0x92,
      ...new TextEncoder().encode('s here</title></head>'),
    ])
    const head = await readHead(streamed([bytes], 'text/html; charset=windows-1252'))
    expect(parseHead(head).title).toBe('It’s here')
  })

  it('falls back to a <meta charset> when the header does not say', async () => {
    const bytes = new Uint8Array([
      ...new TextEncoder().encode('<meta charset="windows-1252"><title>It'),
      0x92,
      ...new TextEncoder().encode('s here</title></head>'),
    ])
    const head = await readHead(streamed([bytes], 'text/html'))
    expect(parseHead(head).title).toBe('It’s here')
  })

  it('maps windows-1252 high bytes the same way on any runtime', async () => {
    // Runtimes disagree about this range, so this pins the table we ship: 0x92
    // is a right single quote, 0x96 an en dash, and 0x81 — a slot windows-1252
    // leaves undefined — keeps its raw code point.
    const bytes = new Uint8Array([
      ...new TextEncoder().encode('<title>'),
      0x92,
      0x96,
      0x81,
      ...new TextEncoder().encode('</title></head>'),
    ])
    const head = await readHead(streamed([bytes], 'text/html; charset=iso-8859-1'))
    expect(parseHead(head).title).toBe('\u2019\u2013\u0081')
  })
})
