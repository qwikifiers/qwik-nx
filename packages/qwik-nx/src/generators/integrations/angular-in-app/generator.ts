import {
  formatFiles,
  generateFiles,
  joinPathFragments,
  ProjectType,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { AngularInAppGeneratorSchema } from './schema';
import { angularInit } from '../../../utils/angular/init';

interface NormalizedSchema extends AngularInAppGeneratorSchema {
  sourceRoot: string;
  projectRoot: string;
  projectType: ProjectType;
}

function normalizeOptions(
  tree: Tree,
  options: AngularInAppGeneratorSchema
): NormalizedSchema {
  const projectConfig = readProjectConfiguration(tree, options.project);

  return {
    ...options,
    installMaterialExample: options.installMaterialExample !== false,
    sourceRoot: projectConfig.sourceRoot ?? projectConfig.root + '/src',
    projectRoot: projectConfig.root,
    projectType: projectConfig.projectType!,
  };
}

function addFiles(tree: Tree, normalizedOptions: NormalizedSchema): void {
  const filePath = normalizedOptions.installMaterialExample
    ? 'material'
    : 'demo';
  generateFiles(
    tree,
    path.join(__dirname, 'files', filePath),
    joinPathFragments(normalizedOptions.sourceRoot, 'routes/angular'),
    {}
  );
}

export async function angularInAppGenerator(
  tree: Tree,
  schema: AngularInAppGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, schema);

  if (normalizedOptions.projectType !== 'application') {
    throw new Error(
      `Only applications are supported, "${normalizedOptions.project}" is a library.`
    );
  }

  const demoFilePath = joinPathFragments(
    normalizedOptions.sourceRoot,
    'integrations/angular'
  );

  if (tree.exists(demoFilePath)) {
    throw new Error(
      `Looks like angular integration has already been configured for ${normalizedOptions.project}. "${demoFilePath}" already exists.`
    );
  }

  const initCallback = angularInit(tree, {
    demoFilePath: joinPathFragments(
      normalizedOptions.sourceRoot,
      'integrations/angular'
    ),
    installMaterialExample: !!normalizedOptions.installMaterialExample,
    projectRoot: normalizedOptions.projectRoot,
    isApp: true,
  });
  addFiles(tree, normalizedOptions);
  if (!normalizedOptions.skipFormat) {
    await formatFiles(tree);
  }

  return initCallback;
}

export default angularInAppGenerator;
