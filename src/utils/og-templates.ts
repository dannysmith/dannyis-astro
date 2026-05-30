import { OG_HANDLE } from '@utils/og-branding';

export interface OGTemplateData {
  title: string;
  description?: string;
  site?: string;
  type?: 'article' | 'note' | 'page';
  url: string;
}

// Shared assets injected by the generator (computed once per build).
export interface OGTemplateContext {
  // Base64 PNG data URI of the baked blobs background (see
  // src/assets/og/background.svg). Sized to match the output dimensions.
  background: string;
  // Base64 PNG data URI of the avatar (public/avatar-circle.png).
  avatar: string;
}

// Canvas is always 1200x630 (the OG standard). Layout values below are in
// that coordinate space. A single ~70px gutter frames the content; the
// decorative blobs live in the baked background, so the text layer only
// has to place the avatar, title, URL and handle.
const PAD = 70;

const ACCENT = '#ff7369'; // coral — matches the blobs
const TEXT = '#ffffff';
const URL_COLOR = '#ffd5d5'; // soft pink — matches the top-left blob
const BG = '#2f3437'; // base background — also used for the title's halo shadow

// The box the title is laid out within (vertically centred inside it).
const TITLE_BOX = { left: PAD, top: 150, width: 1020, height: 300 };
const TITLE_MAX = 96; // largest type size (matches the reference design)
const TITLE_MIN = 44; // smallest we'll shrink to before relying on truncation
const TITLE_LINE_HEIGHT = 1.04;
// Titles longer than this are truncated (word boundary + …). Tuned by eye —
// beyond it even min-size type runs to too many lines. Long-but-under titles
// are allowed to grow lines / graze the blobs; that's fine by design.
const TITLE_MAX_CHARS = 150;

// --- Title fitting -------------------------------------------------------
// Satori has no size-to-fit, so we estimate a size that fits the title box:
// approximate Geist Bold uppercase glyph advances (in em), greedily wrap at a
// candidate size, and take the largest size whose lines fit the box width and
// height. Deliberately rough — it only needs to stop long titles overflowing;
// satori still does the real wrapping.
function glyphEm(ch: string): number {
  if (ch === ' ') return 0.3;
  if (`.,:;'’‘!|iIlj`.includes(ch)) return 0.3;
  if ('MWmw@%'.includes(ch)) return 0.92;
  if (`JTfrt()[]{}/\\-–—"“”`.includes(ch)) return 0.5;
  return 0.64;
}

function textEm(s: string): number {
  let sum = 0;
  for (const ch of s) sum += glyphEm(ch);
  return sum;
}

// Greedy wrap; returns the width (in em) of each resulting line.
function wrapLineEms(words: string[], maxEm: number): number[] {
  const lines: number[] = [];
  let cur = 0;
  let started = false;
  for (const w of words) {
    const wEm = textEm(w);
    const spaceEm = started ? glyphEm(' ') : 0;
    if (started && cur + spaceEm + wEm > maxEm) {
      lines.push(cur);
      cur = wEm;
    } else {
      cur += spaceEm + wEm;
      started = true;
    }
  }
  if (started) lines.push(cur);
  return lines;
}

function fitTitleFontSize(title: string, maxHeight: number = TITLE_BOX.height): number {
  const words = title.split(' ');
  for (let size = TITLE_MAX; size > TITLE_MIN; size -= 2) {
    const maxLineWidth = TITLE_BOX.width * 0.99;
    const lineEms = wrapLineEms(words, maxLineWidth / size);
    // A single word wider than the box is allowed (break-word handles it).
    const widthOk = lineEms.every((em, _, all) => em * size <= maxLineWidth || all.length === 1);
    const heightOk = lineEms.length * size * TITLE_LINE_HEIGHT <= maxHeight * 0.98;
    if (widthOk && heightOk) return size;
  }
  return TITLE_MIN;
}

// --- URL fitting ---------------------------------------------------------
// The URL is one line of Fira Code (monospace), so its width is simply the
// character count times a fixed advance — we solve directly for a size that
// fits the available width (clear of the bottom-right blob), clamped.
const URL_MAX = 27;
const URL_MIN = 15;
const URL_FIT_WIDTH = 720; // px available before the bottom-right blob
const MONO_ADVANCE_EM = 0.6; // Fira Code advance width

function fitUrlFontSize(url: string): number {
  if (!url.length) return URL_MAX;
  const size = Math.floor(URL_FIT_WIDTH / (url.length * MONO_ADVANCE_EM));
  return Math.max(URL_MIN, Math.min(URL_MAX, size));
}

function normalizeTitle(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

function truncateTitle(title: string, max: number): string {
  if (title.length <= max) return title;
  const slice = title.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const base = lastSpace > max * 0.5 ? slice.slice(0, lastSpace) : slice;
  return base.replace(/[\s.,;:!?–—-]+$/, '') + '…';
}

// Width (em) of a leading quote, so we can hang it into the left gutter.
const LEAD_QUOTE_EM: Record<string, number> = {
  '"': 0.5,
  '“': 0.5,
  '”': 0.5,
  '«': 0.55,
  "'": 0.28,
  '‘': 0.28,
  '’': 0.28,
};

// The whole cover is one absolutely-positioned layer over the baked
// background. article / note / default all share this; they differ only in
// the note marker and the default fallback text.
function coverLayout(
  data: OGTemplateData,
  ctx: OGTemplateContext,
  opts: { isNote?: boolean } = {}
) {
  const { isNote = false } = opts;
  const title = truncateTitle(normalizeTitle(data.title || 'danny.is'), TITLE_MAX_CHARS);
  const url = data.url || 'danny.is';
  const fontSize = fitTitleFontSize(title);
  const letterSpacing = `${(-(fontSize * 0.01)).toFixed(2)}px`;
  // Hang a leading opening quote into the gutter so the first letter aligns
  // with the rest of the text block.
  const leadQuoteEm = LEAD_QUOTE_EM[title[0]] ?? 0;
  const textIndent = leadQuoteEm ? `-${(leadQuoteEm * fontSize).toFixed(1)}px` : '0';
  const urlFontSize = fitUrlFontSize(url);

  const children = [
    // Baked blobs + dark background
    {
      type: 'img',
      props: {
        src: ctx.background,
        width: 1200,
        height: 630,
        style: { position: 'absolute', top: 0, left: 0 },
      },
    },

    // Avatar, top-left
    {
      type: 'img',
      props: {
        src: ctx.avatar,
        width: 96,
        height: 96,
        style: {
          position: 'absolute',
          left: PAD,
          top: 54,
          borderRadius: '50%',
          border: '5px solid #ffffff',
        },
      },
    },

    // Note marker — pill in the top-right corner. Absolutely positioned so a
    // multi-line title never pushes it around.
    isNote
      ? {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              right: PAD,
              top: 64,
              display: 'flex',
              alignItems: 'center',
              padding: '8px 18px',
              borderRadius: 999,
              border: '2px solid rgba(255,255,255,0.25)',
              color: URL_COLOR,
              fontFamily: 'Figtree',
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: '3px',
            },
            children: 'NOTE',
          },
        }
      : null,

    // Title — all caps, left-aligned, vertically centred in the upper band.
    {
      type: 'div',
      props: {
        style: {
          position: 'absolute',
          left: PAD,
          top: TITLE_BOX.top,
          width: TITLE_BOX.width,
          height: TITLE_BOX.height,
          display: 'flex',
          alignItems: 'center',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                width: '100%',
                color: TEXT,
                fontFamily: 'Geist',
                fontWeight: 700,
                fontSize: `${fontSize}px`,
                lineHeight: TITLE_LINE_HEIGHT,
                letterSpacing,
                textIndent,
                textTransform: 'uppercase',
                textWrap: 'balance',
                wordBreak: 'break-word',
                // Halo in the background colour: invisible on the plain
                // backdrop, but keeps text legible where a line grazes a blob.
                textShadow: `0 0 6px ${BG}, 0 0 6px ${BG}`,
              },
              children: title,
            },
          },
        ],
      },
    },

    // URL, bottom-left — monospace, shrunk to stay on one line clear of the blob.
    {
      type: 'div',
      props: {
        style: {
          position: 'absolute',
          left: PAD + 2,
          bottom: 96,
          fontFamily: 'Fira Code',
          fontWeight: 400,
          fontSize: urlFontSize,
          color: URL_COLOR,
          whiteSpace: 'nowrap',
        },
        children: url,
      },
    },

    // @handle, very bottom-left
    {
      type: 'div',
      props: {
        style: {
          position: 'absolute',
          left: PAD,
          bottom: 44,
          display: 'flex',
          alignItems: 'baseline',
          fontFamily: 'Geist',
          fontWeight: 700,
          fontSize: 34,
        },
        children: [
          { type: 'span', props: { style: { color: ACCENT }, children: '@' } },
          {
            type: 'span',
            props: { style: { color: TEXT, marginLeft: 1 }, children: OG_HANDLE },
          },
        ],
      },
    },
  ].filter(Boolean);

  return {
    type: 'div',
    props: {
      style: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: BG,
      },
      children,
    },
  };
}

// Standalone "profile" cover for the static default OG image (home + any
// unregistered page): a large avatar on the left with the name big alongside
// it, and the bare site URL. Generated by scripts/generate-og-image.ts — the
// content is fixed, so the avatar can be much larger than on content covers.
function profileCover(data: OGTemplateData, ctx: OGTemplateContext) {
  const words = (data.title || 'Danny Smith').toUpperCase().split(/\s+/);
  const url = data.url || 'danny.is';
  return {
    type: 'div',
    props: {
      style: {
        position: 'relative',
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: BG,
      },
      children: [
        {
          type: 'img',
          props: {
            src: ctx.background,
            width: 1200,
            height: 630,
            style: { position: 'absolute', top: 0, left: 0 },
          },
        },
        // Name on the left, vertically centred, one word per line.
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              left: PAD,
              top: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            },
            children: words.map(word => ({
              type: 'div',
              props: {
                style: {
                  color: TEXT,
                  fontFamily: 'Geist',
                  fontWeight: 700,
                  fontSize: 140,
                  lineHeight: 1.02,
                  letterSpacing: '-1px',
                },
                children: word,
              },
            })),
          },
        },
        // Avatar on the right, vertically centred.
        {
          type: 'img',
          props: {
            src: ctx.avatar,
            width: 280,
            height: 280,
            style: {
              position: 'absolute',
              right: 160,
              top: (630 - 280) / 2,
              borderRadius: '50%',
              border: '7px solid #ffffff',
            },
          },
        },
        // Site URL, bottom-left — a touch larger than on content covers.
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              left: PAD + 2,
              bottom: 50,
              fontFamily: 'Fira Code',
              fontWeight: 400,
              fontSize: 32,
              color: URL_COLOR,
              whiteSpace: 'nowrap',
            },
            children: url,
          },
        },
      ],
    },
  };
}

export const templates = {
  article: (data: OGTemplateData, ctx: OGTemplateContext) => coverLayout(data, ctx),
  note: (data: OGTemplateData, ctx: OGTemplateContext) => coverLayout(data, ctx, { isNote: true }),
  default: (data: OGTemplateData, ctx: OGTemplateContext) =>
    coverLayout({ ...data, title: data.title || 'danny.is' }, ctx),
  profile: (data: OGTemplateData, ctx: OGTemplateContext) => profileCover(data, ctx),
};
