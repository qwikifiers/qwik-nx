import {
  ensurePackage,
  GeneratorCallback,
  readProjectConfiguration,
  Tree,
} from '@nrwl/devkit';
import { getInstalledNxVersion } from '../../utils/get-installed-nx-version';
import { nxKitVersion } from '../../utils/versions';
import { E2eProjectGeneratorSchema, NormalizedSchema } from './schema';
import { normalizeOptions } from './utils/normalize-options';

export async function addE2eProject(
  tree: Tree,
  options: E2eProjectGeneratorSchema
): Promise<GeneratorCallback> {
  const projectConfiguration = readProjectConfiguration(tree, options.project);

  if (projectConfiguration.projectType !== 'application') {
    throw new Error('Cannot setup e2e project for the given frontend project.');
  }

  const normalizedOptions = normalizeOptions(tree, options);
  if (options.e2eTestRunner === 'cypress') {
    return addCypress(tree, normalizedOptions);
  }

  if (options.e2eTestRunner === 'playwright') {
    return addPlaywright(tree, normalizedOptions);
  }

  return () => void 0;
}

async function addCypress(tree: Tree, options: NormalizedSchema) {
  await ensurePackage(tree, '@nrwl/cypress', getInstalledNxVersion(tree));
  const { cypressProjectGenerator } = await import('@nrwl/cypress');

  return await cypressProjectGenerator(tree, {
    ...options,
    name: options.e2eProjectName,
    directory: options.directory,
    project: options.project,
    bundler: 'vite',
    skipFormat: options.skipFormat,
  });
}

async function addPlaywright(tree: Tree, options: NormalizedSchema) {
  await ensurePackage(tree, '@nxkit/playwright', nxKitVersion);
  const { projectGenerator } = await import('@nxkit/playwright');

  return await projectGenerator(tree, {
    ...options,
    name: options.e2eProjectName,
    directory: options.directory,
    frontendProject: options.project,
    skipFormat: options.skipFormat,
  });
}

export default addE2eProject;
