/**
 * MDX component remapping configuration
 *
 * These components are automatically used when rendering MDX content.
 * They provide enhanced functionality over standard HTML elements:
 * - <a> -> SmartLink: Auto-detects internal/external links, adds icons
 * - <img> -> BasicImage: Responsive images with optimization
 *
 * To extend, add more mappings to this object (e.g., code: CustomCode).
 * Components must accept standard HTML element props.
 */
import SmartLink from '@components/mdx/SmartLink.astro';
import BasicImage from '@components/mdx/BasicImage.astro';
import MarkdownBlock from '@components/mdx/MarkdownBlock.astro';

export const MDX_COMPONENT_REMAPPING = {
  a: SmartLink,
  img: BasicImage,
  'markdown-preview': MarkdownBlock,
} as const;
