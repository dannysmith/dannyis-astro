/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** True while post content renders for an RSS feed (see src/utils/feed). */
    feed?: boolean
  }
}
