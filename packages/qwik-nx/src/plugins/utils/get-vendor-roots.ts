import { readWorkspaceConfig } from 'nx/src/project-graph/file-utils';
import {
  QwikNxVitePluginOptions,
  QwikVitePluginOptionsStub,
} from '../models/qwik-nx-vite';
import { readFileSync } from 'fs';
import { join } from 'path';
import { workspaceRoot } from '@nrwl/devkit';
import { getCurrentProjectName } from './current-project-name';
import { filterProjects } from './filter-projects';
import { getProjectDependencies } from './get-project-dependencies';

/** Retrieves vendor roots and applies necessary filtering */
export async function getVendorRoots(
  options: QwikNxVitePluginOptions | undefined,
  qwikOptions: QwikVitePluginOptionsStub
): Promise<string[]> {
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

  if (
    options?.currentProjectName &&
    !workspaceConfig.projects[options.currentProjectName]
  ) {
    throw new Error(
      `Could not find project with name "${options.currentProjectName}"`
    );
  }

  const currentProjectName =
    options?.currentProjectName ??
    getCurrentProjectName(workspaceConfig, qwikOptions.rootDir);

  projects = projects.filter((p) => p.name !== currentProjectName);

  if (!options?.includeProjects) {
    // by default including only project dependencies
    const dependencies = await getProjectDependencies(currentProjectName);
    projects = projects.filter((p) => dependencies.has(p.name!));
    if (options?.debug) {
      log(
        `Dependencies for "${currentProjectName}":`,
        projects.map((p) => p.name)
      );
    }
  }

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
