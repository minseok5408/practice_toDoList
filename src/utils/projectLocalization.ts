import type { Project } from '../types/todo';

const ENGLISH_DEFAULT_PROJECT_NAMES: Record<string, string> = {
  'project-personal': 'Personal',
  'project-work': 'Work',
  'project-study': 'Study',
};

const DEFAULT_PROJECT_COLORS: Record<string, string> = {
  'project-personal': '#3282f6',
  'project-work': '#12a17d',
  'project-study': '#e49a25',
};

export function localizeProjects(
  projects: Project[],
  locale: 'ko' | 'en',
): Project[] {
  return projects.map((project) => ({
    ...project,
    color: DEFAULT_PROJECT_COLORS[project.id] ?? project.color,
    name:
      locale === 'en'
        ? ENGLISH_DEFAULT_PROJECT_NAMES[project.id] ?? project.name
        : project.name,
  }));
}
