import satori from 'satori';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs/promises';
import path from 'path';
import { templates, type OGTemplateData } from './og-templates.js';

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

// Load fonts with fallbacks
async function loadFonts(): Promise<Font[]> {
  const fonts: Font[] = [];

  // Try to load League Spartan static fonts
  const leagueSpartanRegularPath = path.join(
    process.cwd(),
    'public',
    'fonts',
    'LeagueSpartan-Regular.ttf'
  );
  const leagueSpartanBoldPath = path.join(
    process.cwd(),
    'public',
    'fonts',
    'LeagueSpartan-Bold.ttf'
  );

  try {
    const leagueSpartanRegular = await loadFont(leagueSpartanRegularPath);
    if (leagueSpartanRegular.byteLength > 0) {
      fonts.push({
        name: 'League Spartan',
        data: leagueSpartanRegular,
        weight: 400,
        style: 'normal',
      });
    }
  } catch (error) {
    console.warn('League Spartan Regular font not found:', error);
  }

  try {
    const leagueSpartanBold = await loadFont(leagueSpartanBoldPath);
    if (leagueSpartanBold.byteLength > 0) {
      fonts.push({
        name: 'League Spartan',
        data: leagueSpartanBold,
        weight: 700,
        style: 'normal',
      });
    }
  } catch (error) {
    console.warn('League Spartan Bold font not found:', error);
  }

  // If no fonts loaded, provide a minimal fallback
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
    const pngBuffer = pngData.asPng();

    return Buffer.from(pngBuffer);
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
