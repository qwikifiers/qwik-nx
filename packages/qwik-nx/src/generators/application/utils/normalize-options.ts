import {
  getWorkspaceLayout,
  names,
  normalizePath,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import { getRelativePathToRootTsConfig } from '@nrwl/workspace/src/utilities/typescript';
import { NormalizedSchema, QwikAppGeneratorSchema } from '../schema';

function normalizeDirectory(options: QwikAppGeneratorSchema) {
  return options.directory
    ? `${names(options.directory).fileName}/${names(options.name).fileName}`
    : names(options.name).fileName;
}

function normalizeProjectName(options: QwikAppGeneratorSchema) {
  return normalizeDirectory(options).replace(new RegExp('/', 'g'), '-');
}

export const normalizeOptions = (
  host: Tree,
  options: QwikAppGeneratorSchema
): NormalizedSchema => {
  const appDirectory = normalizeDirectory(options);
  const appProjectName = normalizeProjectName(options);

  const { appsDir } = getWorkspaceLayout(host);
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
  };
};
