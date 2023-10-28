import { offsetFromRoot, Tree } from '@nx/devkit';
import { getRelativePathToRootTsConfig } from '@nx/js';
import { NormalizedSchema, QwikAppGeneratorSchema } from '../schema';
import { determineProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils';

export async function normalizeOptions(
  host: Tree,
  options: QwikAppGeneratorSchema
): Promise<NormalizedSchema> {
  const {
    projectName: appProjectName,
    projectRoot: appProjectRoot,
    projectNameAndRootFormat,
  } = await determineProjectNameAndRootOptions(host, {
    name: options.name,
    projectType: 'application',
    callingGenerator: 'qwik-nx:application',
    directory: options.directory,
    projectNameAndRootFormat: options.projectNameAndRootFormat,
  });

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  options.strict = options.strict ?? true;
  options.unitTestRunner = options.unitTestRunner ?? 'vitest';

  const styleExtension = options.style !== 'none' ? options.style : null;

  return {
    ...options,
    projectName: appProjectName,
    projectRoot: appProjectRoot,
    offsetFromRoot: offsetFromRoot(appProjectRoot),
    rootTsConfigPath: getRelativePathToRootTsConfig(host, appProjectRoot),
    styleExtension,
    setupVitest: options.unitTestRunner === 'vitest',
    parsedTags,
    devServerPort: options.devServerPort ?? 5173,
    previewServerPort: options.previewServerPort ?? 4173,
    projectNameAndRootFormat,
  };
}
