import { describe, it, expect } from 'vitest';
import {
  generatePageTitle,
  generateMetaDescription,
  validateSEOData,
  generateJSONLD,
} from '../../src/utils/seo';

describe('SEO Utils', () => {
  describe('generatePageTitle', () => {
    it('adds correct suffix for articles', () => {
      expect(generatePageTitle('My Article', 'article')).toBe(
        'My Article | Danny Smith - Operations & Leadership Expert'
      );
    });

    it('adds correct suffix for notes', () => {
      expect(generatePageTitle('My Note', 'note')).toBe('My Note | Quick Note by Danny Smith');
    });

    it('preserves homepage title unchanged', () => {
      expect(generatePageTitle('Danny Smith')).toBe('Danny Smith');
    });

    it('uses default template for unknown page types', () => {
      // @ts-expect-error - testing unknown page type
      expect(generatePageTitle('Test', 'unknown')).toBe('Test | Danny Smith');
    });
  });

  describe('generateMetaDescription', () => {
    it('adds author suffix to description', () => {
      expect(generateMetaDescription('Test description')).toBe('Test description | Danny Smith');
    });

    it('returns undefined for empty description', () => {
      expect(generateMetaDescription()).toBe(undefined);
      expect(generateMetaDescription('')).toBe(undefined);
    });
  });

  describe('validateSEOData', () => {
    it('provides sensible defaults for empty input', () => {
      const result = validateSEOData({});
      expect(result.title).toBe('Untitled');
      expect(result.type).toBe('website');
      expect(result.tags).toEqual([]);
    });

    it('preserves provided values', () => {
      const input = {
        title: 'Test',
        type: 'article' as const,
        tags: ['tech'],
      };
      const result = validateSEOData(input);
      expect(result).toMatchObject(input);
    });
  });

  describe('generateJSONLD', () => {
    it('generates valid schema for articles', () => {
      const data = {
        title: 'Test Article',
        description: 'Test description',
        type: 'article' as const,
        pageType: 'article' as const,
        pubDate: new Date('2025-01-01'),
        tags: ['tech', 'web'],
      };

      const result = generateJSONLD(data, 'https://danny.is/test', 'https://danny.is/og.png');

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@graph']).toBeInstanceOf(Array);
      expect(result['@graph']).toHaveLength(4); // Person, Org, Website, Article
    });

    it('generates basic schema for non-article pages', () => {
      const data = {
        title: 'Test Page',
        type: 'website' as const,
      };

      const result = generateJSONLD(data, 'https://danny.is/test', 'https://danny.is/og.png');

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@graph']).toHaveLength(3); // Person, Org, Website only
    });
  });
});
