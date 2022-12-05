import { QwikAppGeneratorSchema } from '../schema';
import {
  getWorkspaceLayout,
  names,
  normalizePath,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import { getRelativePathToRootTsConfig } from '@nrwl/workspace/src/utilities/typescript';

export interface NormalizedSchema extends QwikAppGeneratorSchema {
  projectName: string;
  appProjectRoot: string;
  offsetFromRoot: string;
  rootTsConfigPath: string;
  setupVitest: boolean;
  parsedTags: string[];
  styleExtension: Exclude<QwikAppGeneratorSchema['style'], 'none'> | null;
}

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
  const appProjectRoot = normalizePath(`${appsDir}/${appDirectory}`);

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  options.strict = options.strict ?? true;
  options.unitTestRunner = options.unitTestRunner ?? 'vitest';

  const styleExtension = options.style !== 'none' ? options.style : null;

  return {
    ...options,
    projectName: appProjectName,
    appProjectRoot,
    offsetFromRoot: offsetFromRoot(appProjectRoot),
    rootTsConfigPath: getRelativePathToRootTsConfig(host, appProjectRoot),
    styleExtension,
    setupVitest: options.unitTestRunner === 'vitest',
    parsedTags,
  };
};
