import {
  addDependenciesToPackageJson,
  ensurePackage,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  names,
  offsetFromRoot,
  ProjectConfiguration,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';
import { Linter } from '@nx/linter';
import * as path from 'path';
import {
  ensureMdxTypeInTsConfig,
  ensureRootTsxExists,
} from '../../utils/ensure-file-utils';
import { getInstalledNxVersion } from '../../utils/get-installed-nx-version';
import {
  storybookFrameworkQwikVersion,
  reactDOMVersion,
  reactVersion,
  typesMdx,
} from '../../utils/versions';
import {
  NormalizedSchema,
  StorybookConfigurationGeneratorSchema,
} from './schema';

function addFiles(
  tree: Tree,
  options: StorybookConfigurationGeneratorSchema,
  { root }: ProjectConfiguration
) {
  tree.delete(path.join(root, '.storybook/main.js'));

  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(root),
    projectRoot: root,
    configExtension: options.tsConfiguration ? 'ts' : 'js',
  };
  generateFiles(tree, path.join(__dirname, 'files'), root, templateOptions);

  ensureRootTsxExists(tree, options.name);
  ensureMdxTypeInTsConfig(tree, options.name);
}

function normalizeOptions(
  options: StorybookConfigurationGeneratorSchema,
  projectConfig: ProjectConfiguration
): NormalizedSchema {
  let qwikCitySupportInternal: boolean;
  if (options.qwikCitySupport === 'auto' || !options.qwikCitySupport) {
    // "auto"
    qwikCitySupportInternal = projectConfig.projectType === 'application';
  } else {
    // "true" or "false"
    qwikCitySupportInternal = options.qwikCitySupport === 'true';
  }

  return {
    ...options,
    js: !!options.js,
    linter: options.linter ?? Linter.EsLint,
    tsConfiguration: options.tsConfiguration ?? true,
    qwikCitySupportInternal,
  };
}

export async function storybookConfigurationGenerator(
  tree: Tree,
  options: StorybookConfigurationGeneratorSchema
): Promise<GeneratorCallback> {
  const projectConfig = readProjectConfiguration(tree, options.name);

  const normalizedOptions = normalizeOptions(options, projectConfig);
  const nxVersion = getInstalledNxVersion(tree);

  ensurePackage('@nx/storybook', nxVersion);
  const { configurationGenerator } = await import('@nx/storybook');

  const { oldFormat } = await getStorybookVersion();

  await configurationGenerator(tree, {
    storybook7UiFramework: '@storybook/html-webpack5',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    uiFramework: oldFormat ? '@storybook/html' : '@storybook/html-webpack5',
    bundler: 'vite',
    name: normalizedOptions.name,
    js: normalizedOptions.js,
    linter: normalizedOptions.linter,
    tsConfiguration: normalizedOptions.tsConfiguration,
    storybook7Configuration: true,
    configureCypress: false,
  });

  addFiles(tree, normalizedOptions, projectConfig);
  await formatFiles(tree);

  return addStorybookDependencies(tree);
}

async function addStorybookDependencies(
  tree: Tree
): Promise<GeneratorCallback> {
  const { storybookVersion } = await getStorybookVersion();

  return addDependenciesToPackageJson(
    tree,
    {},
    {
      'storybook-framework-qwik': storybookFrameworkQwikVersion,
      '@storybook/builder-vite': storybookVersion,
      '@storybook/addon-docs': storybookVersion,
      react: reactVersion,
      'react-dom': reactDOMVersion,
      '@types/mdx': typesMdx,
    }
  );
}

async function getStorybookVersion() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore "storybook7Version" was renamed to "storybookVersion" in nx16.1. Leaving both for compatibility
  const { storybook7Version, storybookVersion } = await import(
    '@nx/storybook/src/utils/versions'
  );
  const oldFormat = !!storybook7Version;
  return {
    oldFormat,
    storybookVersion: oldFormat ? storybook7Version : storybookVersion,
  };
}

export default storybookConfigurationGenerator;
