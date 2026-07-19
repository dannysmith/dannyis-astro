import { describe, it, expect } from 'vitest'
import { getSortedProjects } from '@utils/content'

type MockProject = {
  id: string
  data: {
    draft?: boolean
    styleguide?: boolean
    title: string
    startDate?: Date
  }
}

function project(id: string, data: Partial<MockProject['data']> = {}): MockProject {
  return { id, data: { title: id, ...data } }
}

describe('getSortedProjects', () => {
  it('sorts newest-first by startDate', () => {
    const projects = [
      project('old', { startDate: new Date('2020-01-01') }),
      project('new', { startDate: new Date('2025-01-01') }),
      project('mid', { startDate: new Date('2023-01-01') }),
    ]

    const ids = getSortedProjects(projects, true).map(p => p.id)
    expect(ids).toEqual(['new', 'mid', 'old'])
  })

  it('floats undated projects to the top', () => {
    const projects = [project('dated', { startDate: new Date('2025-01-01') }), project('undated')]

    const ids = getSortedProjects(projects, true).map(p => p.id)
    expect(ids).toEqual(['undated', 'dated'])
  })

  it('tie-breaks equal/undated by title', () => {
    const ids = getSortedProjects([project('Beta'), project('Alpha')], true).map(p => p.id)
    expect(ids).toEqual(['Alpha', 'Beta'])
  })

  it('excludes drafts in production but keeps them in development', () => {
    const projects = [project('published'), project('draft', { draft: true })]

    expect(getSortedProjects(projects, true).map(p => p.id)).toEqual(['published'])
    expect(getSortedProjects(projects, false).map(p => p.id)).toContain('draft')
  })

  it('handles an empty list', () => {
    expect(getSortedProjects([], true)).toEqual([])
  })
})
