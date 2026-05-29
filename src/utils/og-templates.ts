import { OG_HANDLE } from './og-branding';

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

// Placeholder title sizing for Phase 1: pick a font size from the title
// length so long titles don't overflow the frame. This is deliberately
// crude — Phase 2 replaces it with proper measurement + balanced wrapping.
function pickTitleFontSize(title: string): number {
  const len = title.length;
  if (len <= 22) return 96;
  if (len <= 40) return 80;
  if (len <= 64) return 64;
  if (len <= 100) return 50;
  return 42;
}

// The whole cover is one absolutely-positioned layer over the baked
// background. article / note / default all share this; they differ only in
// the note marker and the default fallback text.
function coverLayout(
  data: OGTemplateData,
  ctx: OGTemplateContext,
  opts: { isNote?: boolean } = {}
) {
  const { isNote = false } = opts;
  const title = data.title || 'danny.is';
  const url = data.url || 'danny.is';
  const fontSize = pickTitleFontSize(title);

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

    // Note marker, top-right (Phase 1 placeholder — refined in Phase 3)
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

    // Title — all caps, left-aligned, vertically centred in the upper band
    {
      type: 'div',
      props: {
        style: {
          position: 'absolute',
          left: PAD,
          top: 150,
          width: 1020,
          height: 300,
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
                lineHeight: 1.04,
                letterSpacing: `${-(fontSize * 0.01).toFixed(2)}px`,
                textTransform: 'uppercase',
                textWrap: 'balance',
                wordBreak: 'break-word',
              },
              children: title,
            },
          },
        ],
      },
    },

    // URL, bottom-left
    {
      type: 'div',
      props: {
        style: {
          position: 'absolute',
          left: PAD + 2,
          bottom: 96,
          fontFamily: 'Figtree',
          fontWeight: 400,
          fontSize: 27,
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
        backgroundColor: '#2f3437',
      },
      children,
    },
  };
}

export const templates = {
  article: (data: OGTemplateData, ctx: OGTemplateContext) => coverLayout(data, ctx),
  note: (data: OGTemplateData, ctx: OGTemplateContext) => coverLayout(data, ctx, { isNote: true }),
  default: (data: OGTemplateData, ctx: OGTemplateContext) =>
    coverLayout({ ...data, title: data.title || 'danny.is' }, ctx),
};
