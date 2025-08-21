import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test the schema logic directly without importing content config
describe('Content Schema Logic', () => {
  describe('Article Schema Components', () => {
    it('validates required string fields', () => {
      const titleSchema = z.string();
      expect(() => titleSchema.parse('Test Article')).not.toThrow();
      expect(() => titleSchema.parse('')).not.toThrow(); // Empty string is valid
      expect(() => titleSchema.parse(123)).toThrow();
    });

    it('coerces date strings correctly', () => {
      const dateSchema = z.coerce.date();
      const result = dateSchema.parse('2025-01-01');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
    });

    it('validates boolean fields with defaults', () => {
      const draftSchema = z.boolean().default(false);
      expect(draftSchema.parse(true)).toBe(true);
      expect(draftSchema.parse(undefined)).toBe(false);
    });

    it('validates optional URL fields', () => {
      const urlSchema = z.string().url().optional();
      expect(() => urlSchema.parse('https://example.com')).not.toThrow();
      expect(() => urlSchema.parse(undefined)).not.toThrow();
      expect(() => urlSchema.parse('not-a-url')).toThrow();
    });

    it('validates array fields', () => {
      const tagsSchema = z.array(z.string()).optional();
      expect(tagsSchema.parse(['tag1', 'tag2'])).toEqual(['tag1', 'tag2']);
      expect(tagsSchema.parse(undefined)).toBe(undefined);
      expect(() => tagsSchema.parse(['tag1', 123])).toThrow();
    });
  });

  describe('Content Frontmatter Structure', () => {
    it('validates typical article frontmatter', () => {
      const articleSchema = z.object({
        title: z.string(),
        pubDate: z.coerce.date(),
        draft: z.boolean().default(false),
        styleguide: z.boolean().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
      });

      const validArticle = {
        title: 'Test Article',
        pubDate: '2025-01-01',
        draft: true,
        tags: ['tech', 'web'],
      };

      expect(() => articleSchema.parse(validArticle)).not.toThrow();
      const result = articleSchema.parse(validArticle);
      expect(result.draft).toBe(true);
      expect(result.pubDate).toBeInstanceOf(Date);
    });

    it('validates typical note frontmatter', () => {
      const noteSchema = z.object({
        title: z.string(),
        pubDate: z.coerce.date(),
        draft: z.boolean().default(false),
        styleguide: z.boolean().optional(),
        sourceURL: z.string().url().optional(),
      });

      const validNote = {
        title: 'Test Note',
        pubDate: '2025-01-01',
        sourceURL: 'https://example.com',
      };

      expect(() => noteSchema.parse(validNote)).not.toThrow();
    });
  });
});
