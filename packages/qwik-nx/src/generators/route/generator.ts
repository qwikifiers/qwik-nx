import {
  formatFiles,
  generateFiles,
  getProjects,
  joinPathFragments,
  logger,
  names,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import * as path from 'path';
import { RouteGeneratorSchema } from './schema';

interface NormalizedSchema extends RouteGeneratorSchema {
  routeName: string;
  projectSourceRoot: string;
  routeDirectory: string;
}

export default routeGenerator;

export async function routeGenerator(
  tree: Tree,
  options: RouteGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);

  addFiles(tree, normalizedOptions);
  await formatFiles(tree);
}

function normalizeOptions(
  tree: Tree,
  options: RouteGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const project = getProjects(tree).get(options.project);

  if (!project) {
    logger.error(
      `Cannot find the ${options.project} project. Please double check the project name.`
    );
    throw new Error();
  }

  const routeDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const routeName = name;

  return {
    ...options,
    routeName,
    projectSourceRoot:
      project.sourceRoot ?? joinPathFragments(project.root, 'src'),
    routeDirectory,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    routeName: names(options.name).fileName,
    offsetFromRoot: offsetFromRoot(options.projectSourceRoot),
    template: '',
  };

  const routesFolder = `${options.projectSourceRoot}/routes`;

  generateFilesByType('route');

  if (options.addLayout) {
    generateFilesByType('layout');
  }

  function generateFilesByType(fileType: 'route' | 'layout') {
    generateFiles(
      tree,
      path.join(__dirname, `files/${fileType}`),
      routesFolder,
      templateOptions
    );
  }
}
