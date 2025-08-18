// Type declarations for Astro components used in barrel exports
// This allows TypeScript to understand .astro imports in .ts files

declare module '*.astro' {
  const Component: any;
  export default Component;
}

// Specific declarations for named exports from barrel files
declare module '@components/mdx' {
  export const Notion: any;
  export const Grid: any;
  export const Callout: any;
  export const BookmarkCard: any;
  export const Embed: any;
  export const Loom: any;
}
