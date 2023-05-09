import {
  extractLayoutDirectory,
  getWorkspaceLayout,
  names,
  normalizePath,
  Tree,
} from '@nx/devkit';
import { E2eProjectGeneratorSchema, NormalizedSchema } from '../schema';

function getE2eProjectName(options: E2eProjectGeneratorSchema) {
  return names(options.project + '-e2e').fileName;
}
function normalizeDirectory(options: E2eProjectGeneratorSchema) {
  const name = getE2eProjectName(options);
  const { projectDirectory } = extractLayoutDirectory(options.directory ?? '');
  return projectDirectory
    ? `${names(projectDirectory).fileName}/${names(name).fileName}`
    : names(name).fileName;
}

export function normalizeOptions(
  tree: Tree,
  options: E2eProjectGeneratorSchema
): NormalizedSchema {
  const extracted = extractLayoutDirectory(options.directory ?? '');

  const appsDir = extracted.layoutDirectory ?? getWorkspaceLayout(tree).appsDir;

  const fullProjectDirectory = normalizeDirectory(options);

  const projectRoot = normalizePath(`${appsDir}/${fullProjectDirectory}`);

  return {
    ...options,
    e2eProjectName: getE2eProjectName(options),
    projectRoot,
    projectDirectory: fullProjectDirectory,
  };
}
