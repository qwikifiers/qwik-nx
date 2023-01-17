import { ensurePackage, Tree } from '@nrwl/devkit';
import { nxKitVersion } from '../../../utils/versions';
import { QwikAppGeneratorSchema } from '../schema';
import { nxVersion } from '../../../utils/versions';
import { NormalizedSchema } from '../schema';

export async function addE2e(
  host: Tree,
  options: NormalizedSchema
): Promise<() => Promise<void> | void> {
  if (options.e2eTestRunner === 'cypress') {
    return addCypress(host, options);
  }

  if (options.e2eTestRunner === 'playwright') {
    return addPlaywright(host, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {};
}

async function addCypress(host: Tree, options: NormalizedSchema) {
  await ensurePackage(host, '@nrwl/cypress', nxVersion);
  const { cypressProjectGenerator } = await import('@nrwl/cypress');

  return await cypressProjectGenerator(host, {
    ...options,
    name: options.e2eProjectName,
    directory: options.directory,
    project: options.projectName,
    rootProject: options.rootProject,
    bundler: options.bundler,
  });
}

async function addPlaywright(tree: Tree, options: NormalizedSchema) {
  await ensurePackage(tree, '@nxkit/playwright', nxKitVersion);
  const { projectGenerator } = await import('@nxkit/playwright');

  return await projectGenerator(tree, {
    ...options,
    name: options.e2eProjectName,
    directory: options.directory,
    project: options.projectName,
    rootProject: options.rootProject,
  });
}
