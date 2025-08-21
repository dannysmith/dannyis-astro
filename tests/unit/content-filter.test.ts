import { describe, it, expect } from 'vitest';

// Helper functions to test the filtering logic used throughout the codebase
function createContentFilter(isProduction: boolean) {
  return ({ data }: { data: { draft?: boolean; styleguide?: boolean } }) => {
    return isProduction ? data.draft !== true : true;
  };
}

function createListingFilter(isProduction: boolean) {
  return ({ data }: { data: { draft?: boolean; styleguide?: boolean } }) => {
    const draftFilter = isProduction ? data.draft !== true : true;
    return draftFilter && !data.styleguide;
  };
}

describe('Content Filtering Logic', () => {
  describe('Individual Page Filter (drafts only)', () => {
    it('excludes drafts in production', () => {
      const filter = createContentFilter(true);
      
      expect(filter({ data: { draft: true } })).toBe(false);
      expect(filter({ data: { draft: false } })).toBe(true);
      expect(filter({ data: {} })).toBe(true); // no draft field = not draft
    });

    it('includes drafts in development', () => {
      const filter = createContentFilter(false);
      
      expect(filter({ data: { draft: true } })).toBe(true);
      expect(filter({ data: { draft: false } })).toBe(true);
      expect(filter({ data: {} })).toBe(true);
    });

    it('allows styleguide pages individually', () => {
      const prodFilter = createContentFilter(true);
      const devFilter = createContentFilter(false);
      
      // Styleguide pages should render individually
      expect(prodFilter({ data: { styleguide: true } })).toBe(true);
      expect(devFilter({ data: { styleguide: true } })).toBe(true);
    });
  });

  describe('Listing Page Filter (drafts + styleguide)', () => {
    it('excludes drafts and styleguide in production', () => {
      const filter = createListingFilter(true);
      
      expect(filter({ data: { draft: true } })).toBe(false);
      expect(filter({ data: { styleguide: true } })).toBe(false);
      expect(filter({ data: { draft: true, styleguide: true } })).toBe(false);
      expect(filter({ data: {} })).toBe(true);
    });

    it('excludes styleguide but includes drafts in development', () => {
      const filter = createListingFilter(false);
      
      expect(filter({ data: { draft: true } })).toBe(true);  // Draft OK in dev
      expect(filter({ data: { styleguide: true } })).toBe(false);  // Styleguide never OK in lists
      expect(filter({ data: {} })).toBe(true);
    });

    it('handles complex combinations', () => {
      const prodFilter = createListingFilter(true);
      const devFilter = createListingFilter(false);

      const testContent = { data: { draft: true, styleguide: true } };
      
      expect(prodFilter(testContent)).toBe(false); // Both exclude in prod
      expect(devFilter(testContent)).toBe(false);  // Styleguide excludes in dev too
    });
  });

  describe('Environment Logic', () => {
    it('handles the exact logic from codebase', () => {
      // Simulate: import.meta.env.PROD ? data.draft !== true : true
      const testFilter = (isProd: boolean, draft?: boolean) => {
        return isProd ? draft !== true : true;
      };

      // Production behavior
      expect(testFilter(true, true)).toBe(false);   // exclude draft
      expect(testFilter(true, false)).toBe(true);   // include non-draft
      expect(testFilter(true, undefined)).toBe(true); // include no draft field

      // Development behavior  
      expect(testFilter(false, true)).toBe(true);    // include draft
      expect(testFilter(false, false)).toBe(true);   // include non-draft
      expect(testFilter(false, undefined)).toBe(true); // include no draft field
    });

    it('handles styleguide exclusion logic', () => {
      // Simulate: draftFilter && !data.styleguide
      const testListingFilter = (isProd: boolean, draft?: boolean, styleguide?: boolean) => {
        const draftFilter = isProd ? draft !== true : true;
        return draftFilter && !styleguide;
      };

      // Styleguide always excluded from listings
      expect(testListingFilter(true, false, true)).toBe(false);
      expect(testListingFilter(false, true, true)).toBe(false);
      
      // Non-styleguide follows draft rules
      expect(testListingFilter(true, false, false)).toBe(true);
      expect(testListingFilter(false, true, false)).toBe(true);
      expect(testListingFilter(true, true, false)).toBe(false);
    });
  });
});