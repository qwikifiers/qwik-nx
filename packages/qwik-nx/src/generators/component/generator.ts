import {
  formatFiles,
  generateFiles,
  GeneratorCallback,
  getProjects,
  joinPathFragments,
  logger,
  names,
  Tree,
} from '@nrwl/devkit';
import { addStyledModuleDependencies } from '../../utils/add-styled-dependencies';
import { ComponentGeneratorSchema } from './schema';

interface NormalizedSchema extends ComponentGeneratorSchema {
  directory: string;
  hasStyles: boolean;
  projectRoot: string;
}

function getDirectory(host: Tree, options: ComponentGeneratorSchema) {
  const workspace = getProjects(host);
  let baseDir: string;
  if (options.directory) {
    baseDir = options.directory;
  } else {
    baseDir =
      workspace.get(options.project)!.projectType === 'application'
        ? 'components'
        : 'lib';
  }
  return options.flat
    ? baseDir
    : joinPathFragments(baseDir, names(options.name).fileName);
}

function normalizeOptions(
  host: Tree,
  options: ComponentGeneratorSchema
): NormalizedSchema {
  const project = getProjects(host).get(options.project);

  if (!project) {
    logger.error(
      `Cannot find the ${options.project} project. Please double check the project name.`
    );
    throw new Error();
  }

  const projectRoot =
    project.sourceRoot ?? joinPathFragments(project.root, 'src');

  const directory = getDirectory(host, options);

  return {
    ...options,
    directory,
    hasStyles: options.style !== 'none',
    projectRoot,
  };
}

function createComponentFiles(tree: Tree, options: NormalizedSchema) {
  const libNames = names(options.name);
  const hasStyles = options.style && options.style !== 'none';
  const templateOptions = {
    ...options,
    ...libNames,
    hasStyles,
  };

  const componentDir = joinPathFragments(
    options.projectRoot,
    options.directory
  );

  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files/common'),
    componentDir,
    templateOptions
  );
  if (hasStyles) {
    generateFiles(
      tree,
      joinPathFragments(__dirname, 'files/styles'),
      componentDir,
      templateOptions
    );
  }
  if (!options.skipTests) {
    generateFiles(
      tree,
      joinPathFragments(__dirname, 'files/tests'),
      componentDir,
      templateOptions
    );
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
