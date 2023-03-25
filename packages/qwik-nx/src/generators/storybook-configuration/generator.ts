import {
  addDependenciesToPackageJson,
  ensurePackage,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  names,
  offsetFromRoot,
  readProjectConfiguration,
  Tree,
} from '@nrwl/devkit';
import * as path from 'path';
import { getInstalledNxVersion } from '../../utils/get-installed-nx-version';
import {
  storybookFrameworkQwikVersion,
  storybookReactDOMVersion,
  storybookReactVersion,
  typesMdx,
} from '../../utils/versions';
import { StorybookConfigurationGeneratorSchema } from './schema';

function addFiles(tree: Tree, options: StorybookConfigurationGeneratorSchema) {
  const { root } = readProjectConfiguration(tree, options.name);

  tree.delete(path.join(root, '.storybook/main.js'));

  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(root),
    projectRoot: root,
  };
  generateFiles(tree, path.join(__dirname, 'files'), root, templateOptions);
}

export async function storybookConfigurationGenerator(
  tree: Tree,
  options: StorybookConfigurationGeneratorSchema
): Promise<GeneratorCallback> {
  ensurePackage('@nrwl/storybook', getInstalledNxVersion(tree));
  const { configurationGenerator } = await import('@nrwl/storybook');

  await configurationGenerator(tree, {
    uiFramework: '@storybook/html',
    bundler: 'vite',
    name: options.name,
    js: options.js,
    linter: options.linter,
    tsConfiguration: options.tsConfiguration,
    storybook7betaConfiguration: true,
    configureCypress: false,
  });

  // TODO: mdx support

  addFiles(tree, options);
  await formatFiles(tree);

  return addStorybookDependencies(tree);
}

async function addStorybookDependencies(
  tree: Tree
): Promise<GeneratorCallback> {
  const { storybook7Version } = await import(
    '@nrwl/storybook/src/utils/versions'
  );

  return addDependenciesToPackageJson(
    tree,
    {},
    {
      'storybook-framework-qwik': storybookFrameworkQwikVersion,
      '@storybook/builder-vite': storybook7Version,
      '@storybook/addon-docs': storybook7Version,
      react: storybookReactVersion,
      'react-dom': storybookReactDOMVersion,
      '@types/mdx': typesMdx,
    }
  );
}

export default storybookConfigurationGenerator;
