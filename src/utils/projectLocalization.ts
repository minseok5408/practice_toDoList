import type { Project } from '../types/todo';

const ENGLISH_DEFAULT_PROJECT_NAMES: Record<string, string> = {
  'project-personal': 'Personal',
  'project-work': 'Work',
  'project-study': 'Study',
};

export function localizeProjects(
  projects: Project[],
  locale: 'ko' | 'en',
): Project[] {
  if (locale === 'ko') return projects;
  return projects.map((project) => ({
    ...project,
    name: ENGLISH_DEFAULT_PROJECT_NAMES[project.id] ?? project.name,
  }));
}
