import { ProjectConfiguration } from '@nrwl/devkit';

export interface ProjectFilter {
  name?: string[] | RegExp;
  path?: RegExp;
  tags?: string[];
  customFilter?: (project: ProjectConfiguration) => boolean;
}

export interface ExcludeProjectFilter extends ProjectFilter {
  /**
   * Set to "true" to keep projects, that are not dependant on the current app according to Nx project graph.
   * By default only related projects are included.
   */
  keepUnrelatedProjects?: boolean;
}

export interface QwikNxVitePluginOptions {
  /**
   * Name of the project, with which plugin is used. By default it will be resolved using the path of the `rootDir` from the Vite environment.
   */
  currentProjectName?: string;
  /**
   * Projects to be included as vendor roots for Qwik to be able to run optimizer over them.
   * If not specified, will include all projects that are recognized as dependencies of the given `currentProjectName`.
   */
  includeProjects?: ProjectFilter;
  /**
   *  Projects to be excluded from the list of resolved vendor roots.
   */
  excludeProjects?: ExcludeProjectFilter;
  debug?: boolean;
}

export interface QwikVitePluginStub {
  api: {
    getOptions: () => QwikVitePluginOptionsStub;
  };
}

export interface QwikVitePluginOptionsStub {
  vendorRoots: string[];
  rootDir: string;
  debug: boolean;
}
