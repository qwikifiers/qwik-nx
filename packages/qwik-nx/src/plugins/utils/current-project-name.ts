import {
  ProjectsConfigurations,
  normalizePath,
  workspaceRoot,
} from '@nx/devkit';
import {
  createProjectRootMappingsFromProjectConfigurations,
  findProjectForPath,
} from 'nx/src/project-graph/utils/find-project-for-path';
import { relative } from 'path';

export function getCurrentProjectName(
  projectsConfigurations: ProjectsConfigurations,
  projectRootDir: string
): string {
  const projectRootMappings =
    createProjectRootMappingsFromProjectConfigurations(
      projectsConfigurations.projects
    );
  const relativeDirname = relative(workspaceRoot, projectRootDir);
  const normalizedRelativeDirname = normalizePath(relativeDirname);
  const currentProjectName = findProjectForPath(
    normalizedRelativeDirname,
    projectRootMappings
  );

  if (!currentProjectName) {
    throw new Error(
      `Could not resolve the project name for path "${projectRootDir}"`
    );
  }
  return currentProjectName;
}
