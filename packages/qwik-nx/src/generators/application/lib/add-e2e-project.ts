import { ensurePackage, GeneratorCallback, Tree } from '@nrwl/devkit';
import { getInstalledNxVersion } from '../../../utils/get-installed-nx-version';
import { nxKitVersion } from '../../../utils/versions';
import { NormalizedSchema } from '../schema';

export async function addE2eProject(
  tree: Tree,
  options: NormalizedSchema
): Promise<GeneratorCallback> {
  if (options.e2eTestRunner === 'cypress') {
    return addCypress(tree, options);
  }

  if (options.e2eTestRunner === 'playwright') {
    return addPlaywright(tree, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {};
}

async function addCypress(tree: Tree, options: NormalizedSchema) {
  await ensurePackage(tree, '@nrwl/cypress', getInstalledNxVersion(tree));
  const { cypressProjectGenerator } = await import('@nrwl/cypress');

  return await cypressProjectGenerator(tree, {
    ...options,
    name: options.e2eProjectName,
    directory: options.directory,
    project: options.projectName,
    bundler: 'vite',
  });
}

async function addPlaywright(tree: Tree, options: NormalizedSchema) {
  await ensurePackage(tree, '@nxkit/playwright', nxKitVersion);
  const { projectGenerator } = await import('@nxkit/playwright');

  return await projectGenerator(tree, {
    ...options,
    name: options.e2eProjectName,
    directory: options.directory,
    frontendProject: options.projectName,
  });
}
