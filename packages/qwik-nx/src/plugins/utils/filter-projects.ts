import { ProjectConfiguration } from '@nrwl/devkit';
import { ProjectFilter } from '../models/qwik-nx-vite';

export function filterProjects(
  projects: ProjectConfiguration[],
  filterConfig: ProjectFilter | undefined,
  exclusive: boolean
): ProjectConfiguration[] {
  if (filterConfig?.name) {
    projects = filterProjectsByName(projects, filterConfig.name, exclusive);
  }
  if (filterConfig?.path) {
    projects = filterProjectsByPath(projects, filterConfig.path, exclusive);
  }
  if (filterConfig?.tags?.length) {
    projects = filterProjectsByTags(projects, filterConfig.tags, exclusive);
  }
  if (typeof filterConfig?.customFilter === 'function') {
    projects = projects.filter((p) => {
      const matches = filterConfig.customFilter!(p);
      return exclusive ? !matches : matches;
    });
  }
  return projects;
}

function filterProjectsByName(
  projects: ProjectConfiguration[],
  options: string[] | RegExp,
  exclusive: boolean
): ProjectConfiguration[] {
  if (Array.isArray(options)) {
    const optionsSet = new Set(options);
    return projects.filter((p) => {
      const matches = optionsSet.has(p.name!);
      return exclusive ? !matches : matches;
    });
  } else if (options instanceof RegExp) {
    return filterByRegex(projects, options, exclusive, (p) => p.name!);
  }
  return projects;
}

function filterProjectsByPath(
  projects: ProjectConfiguration[],
  options: RegExp,
  exclusive: boolean
): ProjectConfiguration[] {
  if (options instanceof RegExp) {
    return filterByRegex(projects, options, exclusive, (p) => p.sourceRoot!);
  }
  return projects;
}

function filterByRegex(
  projects: ProjectConfiguration[],
  options: RegExp,
  exclusive: boolean,
  valueGetter: (p: ProjectConfiguration) => string
): ProjectConfiguration[] {
  if (options instanceof RegExp) {
    if (options.global) {
      console.log(`"global" flag has been removed from the RegExp ${options}`);
      options = new RegExp(options.source, options.flags.replace('g', ''));
    }
    return projects.filter((p) => {
      const matches = (options as RegExp).test(valueGetter(p));
      return exclusive ? !matches : matches;
    });
  }
  return projects;
}

function filterProjectsByTags(
  projects: ProjectConfiguration[],
  tags: string[],
  exclusive: boolean
): ProjectConfiguration[] {
  if (exclusive) {
    return projects.filter((p) => {
      return tags.every((t) => !p.tags?.includes(t));
    });
  } else {
    return projects.filter((p) => {
      return tags.every((t) => p.tags?.includes(t));
    });
  }
}
