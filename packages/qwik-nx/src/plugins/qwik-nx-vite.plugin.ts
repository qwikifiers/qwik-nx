import { type Plugin } from 'vite';
import { join, relative } from 'path';
import { readWorkspaceConfig } from 'nx/src/project-graph/file-utils';
import {
  createProjectRootMappingsFromProjectConfigurations,
  findProjectForPath,
} from 'nx/src/project-graph/utils/find-project-for-path';
import {
  ProjectConfiguration,
  ProjectsConfigurations,
  workspaceRoot,
} from '@nrwl/devkit';
import { readFileSync } from 'fs';

interface QwikVitePluginStub {
  api: {
    getOptions: () => QwikVitePluginOptionsStub;
  };
}

interface QwikVitePluginOptionsStub {
  vendorRoots: string[];
  rootDir: string;
  debug: boolean;
}

export interface ProjectFilter {
  name?: string[] | RegExp;
  path?: RegExp;
  tags?: string[];
  customFilter?: (project: ProjectConfiguration) => boolean;
}

export interface QwikNxVitePluginOptions {
  currentProjectName?: string;
  includeProjects?: ProjectFilter;
  excludeProjects?: ProjectFilter;
  debug?: boolean;
}

/**
 * `qwikNxVite` plugin serves as an integration step between Qwik and Nx.
 * At this point its main purpose is to provide Nx libraries as vendor roots for the Qwik.
 * This is required in order for the optimizer to be able to work with entities imported from those libs.
 *
 * By default `qwikNxVite` plugin will provide Qwik with paths of all Nx projects, that are specified in the tsconfig.base.json.
 * However, this behavior might not be always suitable, especially in cases when you have code that you don't want the optimizer to go through.
 * It is possible to specifically exclude or include certain projects using plugin options.
 */
export function qwikNxVite(options?: QwikNxVitePluginOptions): Plugin {
  const vitePlugin: Plugin = {
    name: 'vite-plugin-qwik-nx',
    enforce: 'pre',

    async configResolved(config) {
      const qwikPlugin = config.plugins.find(
        (p) => p.name === 'vite-plugin-qwik'
      ) as QwikVitePluginStub;
      if (!qwikPlugin) {
        throw new Error('Missing vite-plugin-qwik');
      }

      const pluginOptions = qwikPlugin.api.getOptions();

      const vendorRoots = getVendorRoots(options, pluginOptions);

      pluginOptions.vendorRoots.push(...vendorRoots);
    },
  };

  return vitePlugin;
}

function getCurrentProjectName(
  projectsConfigurations: ProjectsConfigurations,
  projectRootDir: string
): string {
  const projectRootMappings =
    createProjectRootMappingsFromProjectConfigurations(
      projectsConfigurations.projects
    );
  const relativeDirname = relative(workspaceRoot, projectRootDir);
  const currentProjectName = findProjectForPath(
    relativeDirname,
    projectRootMappings
  );

  if (!currentProjectName) {
    throw new Error(
      `Could not resolve the project name for path "${projectRootDir}"`
    );
  }
  return currentProjectName;
}

/** Retrieves vendor roots and applies necessary filtering */
function getVendorRoots(
  options: QwikNxVitePluginOptions | undefined,
  qwikOptions: QwikVitePluginOptionsStub
): string[] {
  const log = (...str: unknown[]) => {
    (options?.debug || qwikOptions.debug) &&
      console.debug(`[QWIK-NX-VITE PLUGIN:]`, ...str);
  };

  const workspaceConfig = readWorkspaceConfig({ format: 'nx' });

  const baseTsConfig = JSON.parse(
    readFileSync(join(workspaceRoot, 'tsconfig.base.json')).toString()
  );
  const decoratedPaths = Object.values<string[]>(
    baseTsConfig.compilerOptions.paths
  ).flat();

  let projects = Object.values(workspaceConfig.projects);

  const currentProjectName =
    options?.currentProjectName ??
    getCurrentProjectName(workspaceConfig, qwikOptions.rootDir);

  projects = projects.filter((p) => p.name !== currentProjectName);

  projects.forEach((p) => (p.sourceRoot ??= p.root));

  projects = filterProjects(projects, options?.excludeProjects, true);
  projects = filterProjects(projects, options?.includeProjects, false);

  if (options?.debug) {
    log(
      'Projects after applying include\\exclude filters:',
      projects.map((p) => p.name)
    );
  }

  projects = projects.filter((p) =>
    decoratedPaths.some((path) => path.startsWith(p.sourceRoot!))
  );

  if (options?.debug) {
    log(
      'Projects after excluding those not in tsconfig.base.json:',
      projects.map((p) => p.name)
    );
  }

  return projects.map((p) => p.sourceRoot).map((p) => join(workspaceRoot, p!));
}

function filterProjects(
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
