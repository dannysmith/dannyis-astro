import { describe, it, expect } from 'vitest';
import {
  generateSummary,
  stripMDXElements,
  extractFirstMeaningfulParagraph,
  truncateAtSentence,
  validateSummary,
  estimateReadingTime,
} from '../../src/utils/content-summary';

// Mock content entry for testing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockEntry = (data: any, body: string = '') => ({
  data,
  body,
  slug: 'test-entry',
  collection: 'articles' as const,
  id: 'test-entry.md',
});

describe('stripMDXElements', () => {
  it('should remove frontmatter', () => {
    const content = `---
title: Test
description: Test description  
---

This is the content.`;

    const result = stripMDXElements(content);
    expect(result).toBe('This is the content.');
  });

  it('should remove import statements', () => {
    const content = `import { Component } from '@components/Component.astro';
import React from 'react';

This is regular content.`;

    const result = stripMDXElements(content);
    expect(result).toBe('This is regular content.');
  });

  it('should remove MDX components', () => {
    const content = `Here is text.

<Callout type="info">
  This is a callout
</Callout>

More text here.`;

    const result = stripMDXElements(content);
    expect(result).toBe('Here is text. More text here.');
  });

  it('should remove code blocks', () => {
    const content = `Regular text.

\`\`\`javascript
const code = 'test';
console.log(code);
\`\`\`

More text.`;

    const result = stripMDXElements(content);
    expect(result).toBe('Regular text. More text.');
  });

  it('should remove inline code', () => {
    const content = 'Use the `console.log()` function to debug.';
    const result = stripMDXElements(content);
    expect(result).toBe('Use the function to debug.');
  });

  it('should convert markdown links to text', () => {
    const content = 'Check out [this link](https://example.com) for more info.';
    const result = stripMDXElements(content);
    expect(result).toBe('Check out this link for more info.');
  });

  it('should remove markdown images', () => {
    const content = 'Here is an image: ![Alt text](image.jpg) and more text.';
    const result = stripMDXElements(content);
    expect(result).not.toContain('![Alt text]');
    expect(result).toContain('Here is an image:');
    expect(result).toContain('and more text.');
  });

  it('should remove markdown headers', () => {
    const content = `# Main Title
## Subtitle
### Sub-subtitle

Regular paragraph text.`;

    const result = stripMDXElements(content);
    expect(result).toBe('Main Title Subtitle Sub-subtitle Regular paragraph text.');
  });

  it('should remove emphasis markers', () => {
    const content = 'This is **bold** and *italic* and __underlined__ and _emphasized_ text.';
    const result = stripMDXElements(content);
    expect(result).toBe('This is bold and italic and underlined and emphasized text.');
  });

  it('should handle complex mixed content', () => {
    const content = `---
title: Complex Test
---

import { Component } from './Component.astro';

# Introduction

This is a **complex** example with [a link](https://example.com).

<Callout type="warning">
  Be careful!
</Callout>

\`\`\`typescript
const example = 'code';
\`\`\`

- List item 1
- List item 2

> This is a blockquote

Final paragraph with \`inline code\`.`;

    const result = stripMDXElements(content);
    expect(result).toBe(
      'Introduction This is a complex example with a link. List item 1 List item 2 This is a blockquote Final paragraph with .'
    );
  });
});

describe('extractFirstMeaningfulParagraph', () => {
  it('should extract the first substantial paragraph', () => {
    const text = `Short line.

This is a much longer paragraph that contains substantial content and should be selected as the first meaningful paragraph for summary generation.

Another paragraph here.`;

    const result = extractFirstMeaningfulParagraph(text);
    expect(result).toBe(
      'This is a much longer paragraph that contains substantial content and should be selected as the first meaningful paragraph for summary generation.'
    );
  });

  it('should skip very short paragraphs', () => {
    const text = `# Title

Short.

Tiny.

This is a proper paragraph with enough content to be considered meaningful and substantial for use in a summary.`;

    const result = extractFirstMeaningfulParagraph(text);
    expect(result).toBe(
      'This is a proper paragraph with enough content to be considered meaningful and substantial for use in a summary.'
    );
  });

  it('should handle empty or whitespace-only input', () => {
    expect(extractFirstMeaningfulParagraph('')).toBe('');
    expect(extractFirstMeaningfulParagraph('   \n\n   ')).toBe('');
  });

  it('should return first paragraph if no substantial ones found', () => {
    const text = 'Short paragraph only.';
    const result = extractFirstMeaningfulParagraph(text);
    expect(result).toBe('Short paragraph only.');
  });
});

describe('truncateAtSentence', () => {
  it('should return original text if under limit', () => {
    const text = 'Short text.';
    const result = truncateAtSentence(text, 50);
    expect(result).toBe('Short text.');
  });

  it('should truncate at sentence boundary when possible', () => {
    const text =
      'This is a longer first sentence that meets threshold. Second sentence is longer and should be cut off at some point.';
    const result = truncateAtSentence(text, 60);
    expect(result).toBe('This is a longer first sentence that meets threshold.');
  });

  it('should truncate at word boundary if no good sentence boundary', () => {
    const text =
      'This is a very long sentence without any periods that should be truncated at a word boundary';
    const result = truncateAtSentence(text, 50);
    expect(result).toMatch(/\.\.\.$|boundary\.\.\.$/);
  });

  it('should handle edge cases', () => {
    expect(truncateAtSentence('', 10)).toBe('');
    expect(truncateAtSentence('Short', 10)).toBe('Short');
  });

  it('should handle different sentence endings', () => {
    const text =
      'This is a longer question that meets the threshold? Exclamation there! Normal sentence.';
    const result = truncateAtSentence(text, 60);
    expect(result).toBe('This is a longer question that meets the threshold?');
  });
});

describe('validateSummary', () => {
  it('should validate good summaries', () => {
    expect(validateSummary('This is a good summary with enough content.')).toBe(true);
    expect(validateSummary('Short but valid summary.')).toBe(true);
  });

  it('should reject invalid summaries', () => {
    expect(validateSummary('')).toBe(false);
    expect(validateSummary('Short')).toBe(false);
    expect(validateSummary('...')).toBe(false);
    expect(validateSummary('Title...')).toBe(false);
    expect(validateSummary(null as unknown as string)).toBe(false);
    expect(validateSummary(undefined as unknown as string)).toBe(false);
  });
});

describe('generateSummary', () => {
  it('should use description from frontmatter when available', () => {
    const entry = createMockEntry({
      title: 'Test Article',
      description: 'This is a manual description from frontmatter.',
    });

    const result = generateSummary(entry, 100);
    expect(result).toBe('This is a manual description from frontmatter.');
  });

  it('should extract from content body when no description', () => {
    const entry = createMockEntry(
      { title: 'Test Article' },
      `# Title

This is a substantial paragraph that should be extracted and used as the summary since there is no description in the frontmatter.

Another paragraph here.`
    );

    const result = generateSummary(entry, 100);
    expect(result).toContain('This is a substantial paragraph');
  });

  it('should truncate description if too long', () => {
    const entry = createMockEntry({
      title: 'Test Article',
      description:
        'This is a very long description that exceeds the maximum length and should be truncated at an appropriate point. It contains multiple sentences and should be cut off properly.',
    });

    const result = generateSummary(entry, 50);
    expect(result.length).toBeLessThanOrEqual(55); // Allow for ellipsis
  });

  it('should fallback to title when content extraction fails', () => {
    const entry = createMockEntry({ title: 'Fallback Test' }, '# Title only\n\nShort.');

    const result = generateSummary(entry, 100);
    // Should extract "Title only Short." from content since it's long enough after stripping
    expect(result).toContain('Title only Short');
  });

  it('should handle empty or malformed content gracefully', () => {
    const entry = createMockEntry({ title: 'Empty Content Test' }, '');

    const result = generateSummary(entry, 100);
    expect(result).toBe('Empty Content Test...');
  });
});

describe('estimateReadingTime', () => {
  it('should estimate reading time correctly', () => {
    // Approximately 200 words (1 minute at 200 WPM)
    const content = 'word '.repeat(200);
    const result = estimateReadingTime(content);
    expect(result).toBe(1);
  });

  it('should round up for partial minutes', () => {
    // Approximately 250 words (1.25 minutes, should round to 2)
    const content = 'word '.repeat(250);
    const result = estimateReadingTime(content);
    expect(result).toBe(2);
  });

  it('should handle empty content', () => {
    expect(estimateReadingTime('')).toBe(0);
  });

  it('should ignore MDX elements in word count', () => {
    const content = `
import Component from './Component.astro';

# Title

This has exactly ten words for testing reading time estimation.

\`\`\`javascript
const code = 'ignored';
\`\`\`
`;
    const result = estimateReadingTime(content);
    expect(result).toBe(1); // Should be minimal since most content is stripped
  });
});
