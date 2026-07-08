import { describe, it, expect } from 'vitest';
import { groupProjectsByStage, PROJECT_STAGE_ORDER, type ProjectStage } from '@utils/content';

type MockProject = {
  id: string;
  data: {
    draft?: boolean;
    styleguide?: boolean;
    title: string;
    stage: ProjectStage;
    startDate?: Date;
  };
};

function project(
  id: string,
  stage: ProjectStage,
  data: Partial<MockProject['data']> = {},
): MockProject {
  return { id, data: { title: id, stage, ...data } };
}

describe('groupProjectsByStage', () => {
  it('returns groups in PROJECT_STAGE_ORDER, dropping empty stages', () => {
    const projects = [
      project('a', 'archived'),
      project('b', 'active-development'),
      project('c', 'finished'),
    ];

    const stages = groupProjectsByStage(projects, true).map(g => g.stage);
    expect(stages).toEqual(['active-development', 'finished', 'archived']);
    // 'actively-maintained' and 'paused' have no projects, so they're dropped
    expect(stages).not.toContain('actively-maintained');
    expect(stages).not.toContain('paused');
  });

  it('sorts within a group newest-first by startDate', () => {
    const projects = [
      project('old', 'active-development', { startDate: new Date('2020-01-01') }),
      project('new', 'active-development', { startDate: new Date('2025-01-01') }),
      project('mid', 'active-development', { startDate: new Date('2023-01-01') }),
    ];

    const ids = groupProjectsByStage(projects, true)[0].projects.map(p => p.id);
    expect(ids).toEqual(['new', 'mid', 'old']);
  });

  it('floats undated projects to the top of their group', () => {
    const projects = [
      project('dated', 'active-development', { startDate: new Date('2025-01-01') }),
      project('undated', 'active-development'),
    ];

    const ids = groupProjectsByStage(projects, true)[0].projects.map(p => p.id);
    expect(ids).toEqual(['undated', 'dated']);
  });

  it('tie-breaks equal/undated by title', () => {
    const projects = [
      project('Beta', 'active-development'),
      project('Alpha', 'active-development'),
    ];

    const ids = groupProjectsByStage(projects, true)[0].projects.map(p => p.id);
    expect(ids).toEqual(['Alpha', 'Beta']);
  });

  it('excludes drafts in production but keeps them in development', () => {
    const projects = [
      project('published', 'active-development'),
      project('draft', 'active-development', { draft: true }),
    ];

    const prod = groupProjectsByStage(projects, true)[0].projects.map(p => p.id);
    expect(prod).toEqual(['published']);

    const dev = groupProjectsByStage(projects, false)[0].projects.map(p => p.id);
    expect(dev).toContain('draft');
  });

  it('provides a human-readable label per group', () => {
    const groups = groupProjectsByStage([project('a', 'active-development')], true);
    expect(groups[0].label).toBe('In active development');
  });

  it('PROJECT_STAGE_ORDER covers exactly the five stages', () => {
    expect(PROJECT_STAGE_ORDER).toHaveLength(5);
  });
});
