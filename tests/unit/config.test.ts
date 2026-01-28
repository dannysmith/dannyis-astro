import { describe, it, expect } from 'vitest';
import { getConfig } from '../../src/config/config';

describe('Site Config', () => {
  const config = getConfig();

  describe('derived values', () => {
    it('computes fullName from givenName and familyName', () => {
      expect(config.author.fullName).toBe(`${config.author.givenName} ${config.author.familyName}`);
    });

    it('computes avatarUrl from site.url and author.avatar', () => {
      expect(config.author.avatarUrl).toBe(`${config.site.url}${config.author.avatar}`);
    });

    it('computes avatarCircleUrl from site.url and author.avatarCircle', () => {
      expect(config.author.avatarCircleUrl).toBe(`${config.site.url}${config.author.avatarCircle}`);
    });

    it('computes twitterHandle with @ prefix', () => {
      expect(config.author.twitterHandle).toBe(`@${config.author.twitter}`);
    });
  });

  describe('seo constants', () => {
    it('has required SEO fields', () => {
      expect(config.seo.robotsDirective).toBeDefined();
      expect(config.seo.twitterCardType).toBe('summary_large_image');
      expect(config.seo.defaultOgImage).toBe('/og-default.png');
      expect(config.seo.articleSection).toBeDefined();
    });

    it('has searchAction with target containing site URL', () => {
      expect(config.seo.searchAction.target).toContain(config.site.url);
      expect(config.seo.searchAction.queryInput).toBeDefined();
    });
  });

  describe('socialProfiles', () => {
    it('has profiles with required fields', () => {
      expect(config.socialProfiles.length).toBeGreaterThan(0);
      config.socialProfiles.forEach(profile => {
        expect(profile.id).toBeDefined();
        expect(profile.name).toBeDefined();
        expect(profile.url).toBeDefined();
        expect(profile.icon).toBeDefined();
      });
    });

    it('has at least one profile with showInFooter', () => {
      const footerProfiles = config.socialProfiles.filter(
        p => 'showInFooter' in p && p.showInFooter
      );
      expect(footerProfiles.length).toBeGreaterThan(0);
    });
  });
});
