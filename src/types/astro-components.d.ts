// Type declarations for Astro components used in barrel exports
// This allows TypeScript to understand .astro imports in .ts files

// Astro component type definition
type AstroComponent = {
  (props: Record<string, unknown>): unknown
  isAstroComponentFactory?: boolean
}

declare module '*.astro' {
  const Component: AstroComponent
  export default Component
}
