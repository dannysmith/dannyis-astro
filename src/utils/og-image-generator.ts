import satori from 'satori';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import { createHash } from 'node:crypto';
import fs from 'fs/promises';
import path from 'path';
import { templates, type OGTemplateData } from './og-templates.js';

// Astro does not cache endpoint output, so every build re-runs satori + resvg
// for every post (~90s on this site). We cache the rendered PNGs ourselves,
// content-addressed by everything that affects the output. The cache lives
// inside Astro's own cache dir so a single CI cache step covers both.
//
// Bump CACHE_VERSION whenever the templates (og-templates.ts), branding
// (og-branding.ts), or the embedded fonts change — those aren't part of the
// per-image key, so a bump is how we invalidate every cached image at once.
const CACHE_DIR = path.join(process.cwd(), 'node_modules', '.astro', 'og-cache');
const CACHE_VERSION = 'v1';

// Font type definition matching Satori's expected format
interface Font {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: 'normal';
}

// Font loading utility
async function loadFont(fontPath: string): Promise<ArrayBuffer> {
  try {
    const fontBuffer = await fs.readFile(fontPath);
    return fontBuffer.buffer.slice(
      fontBuffer.byteOffset,
      fontBuffer.byteOffset + fontBuffer.byteLength
    ) as ArrayBuffer;
  } catch (error) {
    console.warn(`Failed to load font from ${fontPath}:`, error);
    // Return empty buffer as fallback
    return new ArrayBuffer(0);
  }
}

// Satori can't consume WOFF2 (it parses fonts via opentype.js), so the OG
// pipeline keeps a separate set of static TTFs in public/fonts/ even though
// the rest of the site loads Geist + Figtree as WOFF2 via CSS.
const FONT_FILES: Array<{ name: string; file: string; weight: 400 | 700 }> = [
  { name: 'Geist', file: 'Geist-Bold.ttf', weight: 700 },
  { name: 'Figtree', file: 'Figtree-Regular.ttf', weight: 400 },
  { name: 'Figtree', file: 'Figtree-Bold.ttf', weight: 700 },
];

// Load fonts with fallbacks
async function loadFonts(): Promise<Font[]> {
  const fonts: Font[] = [];
  for (const { name, file, weight } of FONT_FILES) {
    const fontPath = path.join(process.cwd(), 'public', 'fonts', file);
    try {
      const data = await loadFont(fontPath);
      if (data.byteLength > 0) {
        fonts.push({ name, data, weight, style: 'normal' });
      }
    } catch (error) {
      console.warn(`Font ${file} not found:`, error);
    }
  }

  if (fonts.length === 0) {
    console.warn('No custom fonts loaded, using system defaults');
  }

  return fonts;
}

// Generate options for Satori
interface GenerateOptions {
  template?: 'article' | 'note' | 'default';
  width?: number;
  height?: number;
}

// Main OG image generation function
export async function generateOGImage(
  data: OGTemplateData,
  options: GenerateOptions = {}
): Promise<Buffer> {
  const { template = 'default', width = 1200, height = 630 } = options;

  // Content-addressed cache key: any change to the data, template, or
  // dimensions produces a different key, so edits regenerate the image.
  const cacheKey = createHash('sha256')
    .update(JSON.stringify({ data, template, width, height, v: CACHE_VERSION }))
    .digest('hex');
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.png`);

  // Cache hit — return the previously rendered PNG.
  try {
    return await fs.readFile(cachePath);
  } catch {
    // Miss (or unreadable) — fall through and generate.
  }

  try {
    // Load fonts
    const fonts = await loadFonts();

    // Get the template function
    const templateFn = templates[template];
    if (!templateFn) {
      throw new Error(`Template "${template}" not found`);
    }

    // Generate the React element structure
    const element = templateFn(data);

    // Generate SVG using Satori
    // @ts-expect-error - satori accepts { type, props } objects at runtime, but types only expose ReactNode
    const svg = await satori(element, {
      width,
      height,
      fonts,
    });

    // Convert SVG to PNG using Resvg
    const resvg = new Resvg(svg);
    const pngData = resvg.render();
    const pngBuffer = Buffer.from(pngData.asPng());

    // Cache the successful render (best-effort; never fail a build over this).
    // The Sharp fallback below is intentionally not cached so a transient
    // satori failure doesn't persist a degraded image across builds.
    try {
      await fs.mkdir(CACHE_DIR, { recursive: true });
      await fs.writeFile(cachePath, pngBuffer);
    } catch (cacheError) {
      console.warn('Failed to write OG image cache:', cacheError);
    }

    return pngBuffer;
  } catch (error) {
    console.error('Satori failed, falling back to Sharp:', error);

    // Fallback to Sharp-based image generation
    return await generateFallbackImage(data.title, width, height);
  }
}

// Fallback image generator using Sharp
async function generateFallbackImage(
  title: string,
  width: number,
  height: number
): Promise<Buffer> {
  // Escape HTML entities in title
  const escapedTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0f0f0f;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${escapedTitle}
      </text>
      <text x="50%" y="90%" font-family="Arial, sans-serif" font-size="24" fill="#666" text-anchor="middle" dominant-baseline="middle">
        danny.is
      </text>
    </svg>
  `;

  return await sharp(Buffer.from(svg)).png().toBuffer();
}
