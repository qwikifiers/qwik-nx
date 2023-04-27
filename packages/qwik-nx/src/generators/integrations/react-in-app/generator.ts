import {
  formatFiles,
  generateFiles,
  joinPathFragments,
  ProjectType,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { ReactInAppGeneratorSchema } from './schema';
import { reactInit } from '../../../utils/react/init';

interface NormalizedSchema extends ReactInAppGeneratorSchema {
  sourceRoot: string;
  projectRoot: string;
  projectType: ProjectType;
}

function normalizeOptions(
  tree: Tree,
  options: ReactInAppGeneratorSchema
): NormalizedSchema {
  const projectConfig = readProjectConfiguration(tree, options.project);

  return {
    ...options,
    installMUIExample: options.installMUIExample !== false,
    sourceRoot: projectConfig.sourceRoot ?? projectConfig.root + '/src',
    projectRoot: projectConfig.root,
    projectType: projectConfig.projectType!,
  };
}

function addFiles(tree: Tree, normalizedOptions: NormalizedSchema): void {
  const filePath = normalizedOptions.installMUIExample ? 'mui' : 'demo';
  generateFiles(
    tree,
    path.join(__dirname, 'files', filePath),
    joinPathFragments(normalizedOptions.sourceRoot, 'routes/react'),
    {}
  );
}

export async function reactInAppGenerator(
  tree: Tree,
  schema: ReactInAppGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, schema);

  if (normalizedOptions.projectType !== 'application') {
    throw new Error(
      `Only applications are supported, "${normalizedOptions.project}" is a library.`
    );
  }

  const demoFilePath = joinPathFragments(
    normalizedOptions.sourceRoot,
    'integrations/react'
  );

  if (tree.exists(demoFilePath)) {
    throw new Error(
      `Looks like react integration has already been configured for ${normalizedOptions.project}. "${demoFilePath}" already exists.`
    );
  }

  const initCallback = reactInit(tree, {
    demoFilePath: joinPathFragments(
      normalizedOptions.sourceRoot,
      'integrations/react'
    ),
    installMUIExample: !!normalizedOptions.installMUIExample,
    projectRoot: normalizedOptions.projectRoot,
  });
  addFiles(tree, normalizedOptions);
  if (!normalizedOptions.skipFormat) {
    await formatFiles(tree);
  }

  return initCallback;
}

export default reactInAppGenerator;
