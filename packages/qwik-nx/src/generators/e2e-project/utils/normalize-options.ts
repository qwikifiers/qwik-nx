import { getWorkspaceLayout, names, Tree } from '@nx/devkit';
import { E2eProjectGeneratorSchema, NormalizedSchema } from '../schema';

export function normalizeOptions(
  tree: Tree,
  options: E2eProjectGeneratorSchema
): NormalizedSchema {
  const name = names(options.project + '-e2e').fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const e2eProjectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;

  return {
    ...options,
    e2eProjectName,
    projectRoot,
    projectDirectory,
  };
}
