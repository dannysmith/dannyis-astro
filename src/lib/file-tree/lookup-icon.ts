/**
 * Resolve an Iconify-style icon name for a file or folder entry in a
 * rendered `tree` block.
 *
 * Returns icon names in the form `<set>:<name>` (consumed by astro-icon's
 * <Icon> component). Two icon sets are used:
 *
 * - `simple-icons:*` — brand/tool logos for specific languages and tools
 *   (typescript, python, docker, etc.). Monochrome, recolourable.
 * - `heroicons:*` — generic categories and fallbacks (folders, photos,
 *   films, audio, archives, generic document). Already installed.
 *
 * Resolution order for files: exact filename match (case-insensitive)
 * → longest matching extension (extension walk: `.test.ts` falls through
 * to `.ts`) → generic `heroicons:document` fallback.
 *
 * Folder open/closed picks between `heroicons:folder` and
 * `heroicons:folder-open`.
 */

const FALLBACK_FILE_ICON = 'heroicons:document';
// Folders use the solid variants — filled folders read better at small sizes
// and make folders pop against the outline file icons.
const FOLDER_ICON = 'heroicons:folder-solid';
const FOLDER_OPEN_ICON = 'heroicons:folder-open-solid';

/**
 * Exact filename matches (lowercased keys). These take precedence over
 * extension-based matches, so e.g. `package.json` resolves to npm rather
 * than the generic JSON icon.
 */
const EXACT_FILENAMES: Record<string, string> = {
  dockerfile: 'simple-icons:docker',
  containerfile: 'simple-icons:docker',
  makefile: 'simple-icons:make',
  gemfile: 'simple-icons:ruby',
  rakefile: 'simple-icons:ruby',
  'cargo.lock': 'simple-icons:rust',
  '.gitignore': 'simple-icons:git',
  '.gitattributes': 'simple-icons:git',
  '.gitkeep': 'simple-icons:git',
  '.gitmodules': 'simple-icons:git',
  'package.json': 'simple-icons:npm',
  'package-lock.json': 'simple-icons:npm',
  'bun.lock': 'simple-icons:bun',
  'bun.lockb': 'simple-icons:bun',
  'yarn.lock': 'simple-icons:yarn',
  'pnpm-lock.yaml': 'simple-icons:pnpm',
  '.nvmrc': 'simple-icons:nodedotjs',
};

/**
 * Extension → icon, keyed without the leading dot (lowercased). Order in
 * the table doesn't matter; the extension walk tries the longest suffix
 * first and falls back to shorter ones.
 */
const EXTENSIONS: Record<string, string> = {
  // TypeScript / JavaScript
  ts: 'simple-icons:typescript',
  tsx: 'simple-icons:typescript',
  js: 'simple-icons:javascript',
  jsx: 'simple-icons:javascript',
  mjs: 'simple-icons:javascript',
  cjs: 'simple-icons:javascript',
  // Markup / data
  md: 'simple-icons:markdown',
  mdx: 'simple-icons:markdown',
  markdown: 'simple-icons:markdown',
  json: 'simple-icons:json',
  jsonc: 'simple-icons:json',
  yaml: 'simple-icons:yaml',
  yml: 'simple-icons:yaml',
  toml: 'simple-icons:toml',
  // Languages
  py: 'simple-icons:python',
  rb: 'simple-icons:ruby',
  rs: 'simple-icons:rust',
  go: 'simple-icons:go',
  php: 'simple-icons:php',
  swift: 'simple-icons:swift',
  kt: 'simple-icons:kotlin',
  kts: 'simple-icons:kotlin',
  dart: 'simple-icons:dart',
  // Web styling/markup
  css: 'simple-icons:css',
  scss: 'simple-icons:sass',
  sass: 'simple-icons:sass',
  html: 'simple-icons:html5',
  htm: 'simple-icons:html5',
  svg: 'simple-icons:svg',
  // Frameworks / tools
  astro: 'simple-icons:astro',
  svelte: 'simple-icons:svelte',
  // Shells
  sh: 'simple-icons:gnubash',
  bash: 'simple-icons:gnubash',
  zsh: 'simple-icons:gnubash',
  // Images
  png: 'heroicons:photo',
  jpg: 'heroicons:photo',
  jpeg: 'heroicons:photo',
  gif: 'heroicons:photo',
  webp: 'heroicons:photo',
  avif: 'heroicons:photo',
  bmp: 'heroicons:photo',
  ico: 'heroicons:photo',
  // Video
  mp4: 'heroicons:film',
  mov: 'heroicons:film',
  webm: 'heroicons:film',
  mkv: 'heroicons:film',
  m4s: 'heroicons:film',
  m3u8: 'heroicons:film',
  // Audio
  mp3: 'heroicons:musical-note',
  wav: 'heroicons:musical-note',
  flac: 'heroicons:musical-note',
  ogg: 'heroicons:musical-note',
  aac: 'heroicons:musical-note',
  m4a: 'heroicons:musical-note',
  // Archives
  zip: 'heroicons:archive-box',
  tar: 'heroicons:archive-box',
  gz: 'heroicons:archive-box',
  tgz: 'heroicons:archive-box',
  rar: 'heroicons:archive-box',
  '7z': 'heroicons:archive-box',
  // Plain-text-ish
  txt: 'heroicons:document-text',
  pdf: 'heroicons:document-text',
  log: 'heroicons:document-text',
};

/**
 * Coarse colour buckets for file icons, used purely as a skim aid (named
 * after the colour, since the rules are deliberately made-up). Mapped to
 * design tokens in FileTreeNodes.astro; all are `light-dark()` so they
 * adapt per theme automatically.
 */
export type IconColor = 'blue' | 'red' | 'green' | 'orange' | 'purple' | 'neutral';

/** Exact-filename colour overrides (lowercased keys). */
const COLOR_BY_FILENAME: Record<string, IconColor> = {
  dockerfile: 'orange',
  containerfile: 'orange',
  makefile: 'orange',
  gemfile: 'red',
  rakefile: 'red',
  'cargo.lock': 'orange',
  '.gitignore': 'orange',
  '.gitattributes': 'orange',
  '.gitkeep': 'orange',
  '.gitmodules': 'orange',
  'package.json': 'orange',
  'package-lock.json': 'orange',
  'bun.lock': 'orange',
  'bun.lockb': 'orange',
  'yarn.lock': 'orange',
  'pnpm-lock.yaml': 'orange',
  '.nvmrc': 'orange',
};

/** Extension → colour bucket (keyed without the leading dot, lowercased). */
const COLOR_BY_EXT: Record<string, IconColor> = {
  // Code → blue
  ts: 'blue',
  tsx: 'blue',
  js: 'blue',
  jsx: 'blue',
  mjs: 'blue',
  cjs: 'blue',
  py: 'blue',
  rs: 'blue',
  go: 'blue',
  swift: 'blue',
  kt: 'blue',
  kts: 'blue',
  dart: 'blue',
  php: 'blue',
  astro: 'blue',
  svelte: 'blue',
  sh: 'blue',
  bash: 'blue',
  zsh: 'blue',
  // Ruby + video → red
  rb: 'red',
  mp4: 'red',
  mov: 'red',
  webm: 'red',
  mkv: 'red',
  m4s: 'red',
  m3u8: 'red',
  // Images → green
  png: 'green',
  jpg: 'green',
  jpeg: 'green',
  gif: 'green',
  webp: 'green',
  avif: 'green',
  bmp: 'green',
  ico: 'green',
  svg: 'green',
  // Config / data → orange
  json: 'orange',
  jsonc: 'orange',
  yaml: 'orange',
  yml: 'orange',
  toml: 'orange',
  // Styles + audio → purple
  css: 'purple',
  scss: 'purple',
  sass: 'purple',
  html: 'purple',
  htm: 'purple',
  mp3: 'purple',
  wav: 'purple',
  flac: 'purple',
  ogg: 'purple',
  aac: 'purple',
  m4a: 'purple',
  // Docs → neutral (md/txt/pdf/log; everything unmatched also falls here)
  md: 'neutral',
  mdx: 'neutral',
  markdown: 'neutral',
  txt: 'neutral',
  pdf: 'neutral',
  log: 'neutral',
};

/**
 * Resolve a value for a filename: exact filename match (case-insensitive)
 * wins, else an extension walk tries the longest dotted suffix first and
 * peels off leading segments (`foo.test.ts` → `test.ts` → `ts`).
 */
function resolveByName<T>(
  name: string,
  exact: Record<string, T>,
  byExt: Record<string, T>
): T | undefined {
  const lower = name.toLowerCase();

  const exactHit = exact[lower];
  if (exactHit !== undefined) return exactHit;

  let rest = lower;
  while (true) {
    const dot = rest.indexOf('.');
    if (dot === -1) break;
    const ext = rest.slice(dot + 1);
    const extHit = byExt[ext];
    if (extHit !== undefined) return extHit;
    rest = ext;
  }

  return undefined;
}

export function iconForFolder(open = false): string {
  return open ? FOLDER_OPEN_ICON : FOLDER_ICON;
}

export function iconForFile(name: string): string {
  return resolveByName(name, EXACT_FILENAMES, EXTENSIONS) ?? FALLBACK_FILE_ICON;
}

export function colorForFile(name: string): IconColor {
  return resolveByName(name, COLOR_BY_FILENAME, COLOR_BY_EXT) ?? 'neutral';
}
