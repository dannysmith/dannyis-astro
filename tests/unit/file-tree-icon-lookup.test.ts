import { describe, it, expect } from 'vitest';
import { iconForFile, iconForFolder, colorForFile } from '../../src/lib/file-tree/lookup-icon';

describe('iconForFolder', () => {
  it('returns the closed-folder icon by default', () => {
    expect(iconForFolder()).toBe('heroicons:folder-solid');
  });

  it('returns the closed-folder icon when open=false', () => {
    expect(iconForFolder(false)).toBe('heroicons:folder-solid');
  });

  it('returns the open-folder icon when open=true', () => {
    expect(iconForFolder(true)).toBe('heroicons:folder-open-solid');
  });
});

describe('iconForFile', () => {
  describe('fallback', () => {
    it('returns the generic document icon for an unknown extension', () => {
      expect(iconForFile('mystery.xyzzy')).toBe('heroicons:document');
    });

    it('returns the generic document icon for an extensionless unknown file', () => {
      expect(iconForFile('weirdfile')).toBe('heroicons:document');
    });
  });

  describe('extension → language/tool (simple-icons)', () => {
    it.each([
      ['index.ts', 'simple-icons:typescript'],
      ['Component.tsx', 'simple-icons:typescript'],
      ['app.js', 'simple-icons:javascript'],
      ['app.jsx', 'simple-icons:javascript'],
      ['app.mjs', 'simple-icons:javascript'],
      ['app.cjs', 'simple-icons:javascript'],
      ['post.md', 'simple-icons:markdown'],
      ['post.mdx', 'simple-icons:markdown'],
      ['data.json', 'simple-icons:json'],
      ['data.jsonc', 'simple-icons:json'],
      ['config.yaml', 'simple-icons:yaml'],
      ['config.yml', 'simple-icons:yaml'],
      ['Cargo.toml', 'simple-icons:toml'],
      ['script.py', 'simple-icons:python'],
      ['main.rb', 'simple-icons:ruby'],
      ['lib.rs', 'simple-icons:rust'],
      ['main.go', 'simple-icons:go'],
      ['styles.css', 'simple-icons:css'],
      ['styles.scss', 'simple-icons:sass'],
      ['styles.sass', 'simple-icons:sass'],
      ['page.html', 'simple-icons:html5'],
      ['page.htm', 'simple-icons:html5'],
      ['icon.svg', 'simple-icons:svg'],
      ['Page.astro', 'simple-icons:astro'],
      ['Component.svelte', 'simple-icons:svelte'],
      ['run.sh', 'simple-icons:gnubash'],
      ['run.bash', 'simple-icons:gnubash'],
      ['run.zsh', 'simple-icons:gnubash'],
      ['app.php', 'simple-icons:php'],
      ['view.swift', 'simple-icons:swift'],
      ['Main.kt', 'simple-icons:kotlin'],
      ['main.dart', 'simple-icons:dart'],
    ])('maps %s to %s', (input, expected) => {
      expect(iconForFile(input)).toBe(expected);
    });
  });

  describe('extension → generic category (heroicons)', () => {
    it.each([
      ['photo.png', 'heroicons:photo'],
      ['photo.jpg', 'heroicons:photo'],
      ['photo.jpeg', 'heroicons:photo'],
      ['anim.gif', 'heroicons:photo'],
      ['next-gen.webp', 'heroicons:photo'],
      ['movie.mp4', 'heroicons:film'],
      ['movie.mov', 'heroicons:film'],
      ['movie.webm', 'heroicons:film'],
      ['stream.m3u8', 'heroicons:film'],
      ['seg_000.m4s', 'heroicons:film'],
      ['song.mp3', 'heroicons:musical-note'],
      ['sample.wav', 'heroicons:musical-note'],
      ['lossless.flac', 'heroicons:musical-note'],
      ['bundle.zip', 'heroicons:archive-box'],
      ['archive.tar', 'heroicons:archive-box'],
      ['archive.tar.gz', 'heroicons:archive-box'],
      ['notes.txt', 'heroicons:document-text'],
      ['report.pdf', 'heroicons:document-text'],
      ['app.log', 'heroicons:document-text'],
    ])('maps %s to %s', (input, expected) => {
      expect(iconForFile(input)).toBe(expected);
    });
  });

  describe('case-insensitive extension matching', () => {
    it('matches uppercase extensions', () => {
      expect(iconForFile('PHOTO.JPG')).toBe('heroicons:photo');
    });

    it('matches mixed-case extensions', () => {
      expect(iconForFile('App.Tsx')).toBe('simple-icons:typescript');
    });
  });

  describe('extension walk (compound extensions)', () => {
    it('walks .test.ts down to .ts', () => {
      expect(iconForFile('foo.test.ts')).toBe('simple-icons:typescript');
    });

    it('walks .d.ts down to .ts', () => {
      expect(iconForFile('types.d.ts')).toBe('simple-icons:typescript');
    });

    it('walks .tar.gz down to .gz (archive)', () => {
      // .gz alone isn't separately mapped; .tar.gz hits .gz via walk
      // Both should resolve to the archive icon since both are in our archive list.
      expect(iconForFile('backup.tar.gz')).toBe('heroicons:archive-box');
    });
  });

  describe('exact filename matches (case-insensitive)', () => {
    it.each([
      ['Dockerfile', 'simple-icons:docker'],
      ['dockerfile', 'simple-icons:docker'],
      ['DOCKERFILE', 'simple-icons:docker'],
      ['Containerfile', 'simple-icons:docker'],
      ['Makefile', 'simple-icons:make'],
      ['makefile', 'simple-icons:make'],
      ['Gemfile', 'simple-icons:ruby'],
      ['Rakefile', 'simple-icons:ruby'],
      ['Cargo.lock', 'simple-icons:rust'],
      ['.gitignore', 'simple-icons:git'],
      ['.gitattributes', 'simple-icons:git'],
      ['.gitkeep', 'simple-icons:git'],
      ['package.json', 'simple-icons:npm'],
      ['package-lock.json', 'simple-icons:npm'],
      ['bun.lock', 'simple-icons:bun'],
      ['bun.lockb', 'simple-icons:bun'],
      ['yarn.lock', 'simple-icons:yarn'],
      ['pnpm-lock.yaml', 'simple-icons:pnpm'],
      ['.nvmrc', 'simple-icons:nodedotjs'],
    ])('maps %s to %s', (input, expected) => {
      expect(iconForFile(input)).toBe(expected);
    });
  });

  describe('precedence', () => {
    it('exact filename match beats extension match', () => {
      // package.json's extension would say "json" but the exact filename
      // override should win.
      expect(iconForFile('package.json')).toBe('simple-icons:npm');
    });
  });
});

describe('colorForFile', () => {
  it.each([
    // code → blue
    ['index.ts', 'blue'],
    ['app.jsx', 'blue'],
    ['main.go', 'blue'],
    ['lib.rs', 'blue'],
    ['run.sh', 'blue'],
    // ruby + video → red
    ['main.rb', 'red'],
    ['movie.mp4', 'red'],
    ['stream.m3u8', 'red'],
    // images → green
    ['photo.png', 'green'],
    ['logo.svg', 'green'],
    // config / data → orange
    ['data.json', 'orange'],
    ['config.yaml', 'orange'],
    ['Cargo.toml', 'orange'],
    // styles + audio → purple
    ['styles.css', 'purple'],
    ['styles.scss', 'purple'],
    ['song.mp3', 'purple'],
    ['page.html', 'purple'],
    // docs → neutral
    ['post.md', 'neutral'],
    ['notes.txt', 'neutral'],
  ])('colours %s as %s', (input, expected) => {
    expect(colorForFile(input)).toBe(expected);
  });

  it('falls back to neutral for unknown extensions', () => {
    expect(colorForFile('mystery.xyzzy')).toBe('neutral');
  });

  it('matches case-insensitively', () => {
    expect(colorForFile('App.TS')).toBe('blue');
  });

  it('walks compound extensions (foo.test.ts → blue)', () => {
    expect(colorForFile('foo.test.ts')).toBe('blue');
  });

  it('applies exact-filename colour overrides (Gemfile → red)', () => {
    expect(colorForFile('Gemfile')).toBe('red');
  });

  it('exact filename override beats extension (package.json → orange)', () => {
    expect(colorForFile('package.json')).toBe('orange');
  });
});
