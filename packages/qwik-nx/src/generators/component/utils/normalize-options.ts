import {
  Tree,
  getProjects,
  joinPathFragments,
  readProjectConfiguration,
} from '@nx/devkit';
import { normalizePath } from 'vite';
import { ComponentGeneratorSchema, NormalizedSchema } from '../schema';

type GenerationPaths = {
  directory: string;
  name: string;
};

type NameInfo = { name: string; path: string };

function parseNameWithPath(rawName: string): NameInfo {
  const parsedName = normalizePath(rawName).split('/');
  const name = parsedName.pop()!;
  const path = parsedName.join('/');

  return { name, path };
}

function normalizeNameAndPaths(
  tree: Tree,
  options: ComponentGeneratorSchema
): GenerationPaths {
  const { root, sourceRoot, projectType } = readProjectConfiguration(
    tree,
    options.project
  );

  const projectSourceRoot = sourceRoot ?? joinPathFragments(root, 'src');
  const { name, path: namePath } = parseNameWithPath(options.name);

  const path =
    options.directory ??
    joinPathFragments(
      projectSourceRoot,
      projectType === 'application' ? 'components' : 'lib',
      namePath
    );

  const directory = options.flat
    ? normalizePath(path)
    : joinPathFragments(path, name);

  return {
    directory,
    name,
  };
}

export function normalizeOptions(
  host: Tree,
  options: ComponentGeneratorSchema
): NormalizedSchema {
  const project = getProjects(host).get(options.project);

  if (!project) {
    throw new Error(
      `Cannot find the ${options.project} project. Please double check the project name.`
    );
  }

  const projectRoot =
    project.sourceRoot ?? joinPathFragments(project.root, 'src');

  const nameAndPath = normalizeNameAndPaths(host, options);

  if (!nameAndPath.directory.startsWith(project.root)) {
    throw new Error(
      `The provided path "${options.directory}" (resolved as "${nameAndPath.directory}") does not exist under the project root ("${project.root}"). ` +
        `Please make sure to provide a path that exists under the project root.`
    );
  }

  return {
    ...options,
    ...nameAndPath,
    hasStyles: options.style !== 'none',
    projectRoot,
    exportDefault: !!options.exportDefault,
  };
}
