import { offsetFromRoot, Tree } from '@nx/devkit';
import { getRelativePathToRootTsConfig } from '@nx/js';
import { NormalizedSchema, QwikAppGeneratorSchema } from '../schema';
import {
  determineProjectNameAndRootOptions,
  ensureProjectName,
} from '@nx/devkit/src/generators/project-name-and-root-utils';

export async function normalizeOptions(
  host: Tree,
  options: QwikAppGeneratorSchema
): Promise<NormalizedSchema> {
  await ensureProjectName(host, options, 'application');

  const { projectName: appProjectName, projectRoot: appProjectRoot } =
    await determineProjectNameAndRootOptions(host, {
      name: options.name,
      projectType: 'application',
      directory: options.directory,
    });

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  options.strict = options.strict ?? true;
  options.unitTestRunner = options.unitTestRunner ?? 'vitest';

  const rootProject = appProjectRoot === '.';
  const e2eProjectName = rootProject ? 'e2e' : `${appProjectName}-e2e`;
  const e2eProjectRoot = rootProject ? 'e2e' : `${appProjectRoot}-e2e`;

  const styleExtension = options.style !== 'none' ? options.style : null;

  return {
    ...options,
    name: options.name!, // defined by "ensureProjectName"
    projectName: appProjectName,
    projectRoot: appProjectRoot,
    offsetFromRoot: offsetFromRoot(appProjectRoot),
    rootTsConfigPath: getRelativePathToRootTsConfig(host, appProjectRoot),
    styleExtension,
    setupVitest: options.unitTestRunner === 'vitest',
    parsedTags,
    devServerPort: options.devServerPort ?? 5173,
    previewServerPort: options.previewServerPort ?? 4173,
    e2eProjectName,
    e2eProjectRoot,
  };
}
