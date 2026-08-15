import { describe, it, expect } from 'vitest'
import { classifyShape } from '@utils/bookmarkImage'

describe('classifyShape', () => {
  it('treats wide previews as banners', () => {
    expect(classifyShape(1200, 630)).toBe('banner')
    expect(classifyShape(2400, 1260)).toBe('banner')
    expect(classifyShape(1200, 675)).toBe('banner')
  })

  it('treats square previews as logos', () => {
    // Real shapes from links on this site: adactio 300×300, interconnected
    // 400×400, tomtunguz 1024×1024, laike9m 150×150, seangoedecke 800×800.
    expect(classifyShape(300, 300)).toBe('logo')
    expect(classifyShape(400, 400)).toBe('logo')
    expect(classifyShape(1024, 1024)).toBe('logo')
    expect(classifyShape(150, 150)).toBe('logo')
    expect(classifyShape(800, 800)).toBe('logo')
  })

  it('treats taller-than-wide previews as logos', () => {
    expect(classifyShape(600, 800)).toBe('logo')
  })

  it('keeps 4:3 and 3:2 photos on the banner side', () => {
    // karlbode 1200×900 and clagnut 700×481 are photographs, not logos —
    // a crop suits them, letterboxing doesn't.
    expect(classifyShape(1200, 900)).toBe('banner')
    expect(classifyShape(700, 481)).toBe('banner')
    expect(classifyShape(420, 300)).toBe('banner')
  })
})
