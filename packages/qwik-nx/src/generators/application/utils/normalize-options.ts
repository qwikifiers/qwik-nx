import {
  extractLayoutDirectory,
  getWorkspaceLayout,
  names,
  normalizePath,
  offsetFromRoot,
  Tree,
} from '@nx/devkit';
import { getRelativePathToRootTsConfig } from '@nx/js';
import { NormalizedSchema, QwikAppGeneratorSchema } from '../schema';

function normalizeDirectory(options: QwikAppGeneratorSchema) {
  const { projectDirectory } = extractLayoutDirectory(options.directory ?? '');
  return projectDirectory
    ? `${names(projectDirectory).fileName}/${names(options.name).fileName}`
    : names(options.name).fileName;
}

function normalizeProjectName(options: QwikAppGeneratorSchema) {
  return normalizeDirectory(options).replace(new RegExp('/', 'g'), '-');
}

export function normalizeOptions(
  host: Tree,
  options: QwikAppGeneratorSchema
): NormalizedSchema {
  const appDirectory = normalizeDirectory(options);
  const appProjectName = normalizeProjectName(options);

  const { layoutDirectory } = extractLayoutDirectory(options.directory ?? '');
  const appsDir = layoutDirectory ?? getWorkspaceLayout(host).appsDir;
  const projectRoot = normalizePath(`${appsDir}/${appDirectory}`);

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  options.strict = options.strict ?? true;
  options.unitTestRunner = options.unitTestRunner ?? 'vitest';

  const styleExtension = options.style !== 'none' ? options.style : null;

  return {
    ...options,
    projectName: appProjectName,
    projectRoot,
    offsetFromRoot: offsetFromRoot(projectRoot),
    rootTsConfigPath: getRelativePathToRootTsConfig(host, projectRoot),
    styleExtension,
    setupVitest: options.unitTestRunner === 'vitest',
    parsedTags,
    devServerPort: options.devServerPort ?? 4200,
    previewServerPort: options.previewServerPort ?? 4300,
  };
}
