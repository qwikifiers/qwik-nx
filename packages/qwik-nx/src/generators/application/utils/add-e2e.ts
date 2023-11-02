import {
  addProjectConfiguration,
  ensurePackage,
  GeneratorCallback,
  getPackageManagerCommand,
  joinPathFragments,
  Tree,
} from '@nx/devkit';
import { getInstalledNxVersion } from '../../../utils/get-installed-nx-version';
import { NormalizedSchema } from '../schema';
import { Linter } from '@nx/linter';

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

  return () => void 0;
}

async function addCypress(tree: Tree, options: NormalizedSchema) {
  ensurePackage('@nx/cypress', getInstalledNxVersion(tree));
  const { configurationGenerator } = await import('@nx/cypress');

  addProjectConfiguration(tree, options.e2eProjectName, {
    projectType: 'application',
    root: options.e2eProjectRoot,
    sourceRoot: joinPathFragments(options.e2eProjectRoot, 'src'),
    targets: {},
    tags: [],
    implicitDependencies: [options.projectName],
  });
  return await configurationGenerator(tree, {
    project: options.e2eProjectName,
    directory: 'src',
    linter: options.linter,
    skipFormat: true,
    devServerTarget: `${options.projectName}:serve:development`,
  });
}

async function addPlaywright(tree: Tree, options: NormalizedSchema) {
  ensurePackage('@nx/playwright', getInstalledNxVersion(tree));
  const { configurationGenerator: playwrightConfigurationGenerator } =
    await import('@nx/playwright');

  addProjectConfiguration(tree, options.e2eProjectName, {
    projectType: 'application',
    root: options.e2eProjectRoot,
    sourceRoot: joinPathFragments(options.e2eProjectRoot, 'src'),
    targets: {},
    implicitDependencies: [options.projectName],
  });
  return await playwrightConfigurationGenerator(tree, {
    project: options.e2eProjectName,
    skipFormat: true,
    directory: 'src',
    js: false,
    linter: options.linter ?? Linter.EsLint,
    webServerCommand: `${getPackageManagerCommand().exec} nx serve ${
      options.projectName
    }`,
    webServerAddress: `http://localhost:${options.devServerPort ?? 4200}`,
    setParserOptionsProject: true,
    skipPackageJson: false,
  });
}
