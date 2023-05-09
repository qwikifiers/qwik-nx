import {
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  names,
  Tree,
} from '@nx/devkit';
import { addStyledModuleDependencies } from '../../utils/add-styled-dependencies';
import { ensureMdxTypeInTsConfig } from '../../utils/ensure-file-utils';
import { ComponentGeneratorSchema, NormalizedSchema } from './schema';
import { normalizeOptions } from './utils/normalize-options';

function createComponentFiles(tree: Tree, options: NormalizedSchema) {
  const libNames = names(options.name);
  const hasStyles = options.style && options.style !== 'none';
  const templateOptions = {
    ...options,
    ...libNames,
    hasStyles,
    importExportStatement: options.exportDefault
      ? libNames.className
      : `{ ${libNames.className} }`,
  };

  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files/common'),
    options.directory,
    templateOptions
  );
  if (hasStyles) {
    generateFiles(
      tree,
      joinPathFragments(__dirname, 'files/styles'),
      options.directory,
      templateOptions
    );
  }
  if (!options.skipTests) {
    generateFiles(
      tree,
      joinPathFragments(__dirname, 'files/tests'),
      options.directory,
      templateOptions
    );
  }
  if (options.generateStories) {
    generateFiles(
      tree,
      joinPathFragments(__dirname, 'files/storybook'),
      options.directory,
      templateOptions
    );
    ensureMdxTypeInTsConfig(tree, options.project);
  }
}

export async function componentGenerator(
  tree: Tree,
  options: ComponentGeneratorSchema
): Promise<GeneratorCallback> {
  const normalizedOptions = normalizeOptions(tree, options);
  createComponentFiles(tree, normalizedOptions);
  await formatFiles(tree);

  return addStyledModuleDependencies(tree, normalizedOptions.style);
}

export default componentGenerator;
