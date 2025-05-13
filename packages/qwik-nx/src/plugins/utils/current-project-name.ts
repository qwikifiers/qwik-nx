import { ProjectGraph, normalizePath, workspaceRoot } from '@nx/devkit';
import {
  createProjectRootMappings,
  findProjectForPath,
} from 'nx/src/project-graph/utils/find-project-for-path';
import { relative } from 'path';

export function getCurrentProjectName(
  projectGraph: ProjectGraph,
  projectRootDir: string
): string {
  const projectRootMappings = createProjectRootMappings(projectGraph.nodes);
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
