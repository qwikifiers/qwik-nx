import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import { addCommonQwikDependencies } from '../../utils/add-common-qwik-dependencies';
import { QwikWorkspacePresetGeneratorSchema } from './schema';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import * as path from 'path';
import { getRelativePathToRootTsConfig } from '@nrwl/workspace/src/utilities/typescript';
import { NormalizedSchema } from '../application/utils/normalize-options';
import { configureVite } from '../application/generator';

// In order to reuse the files in the application generator,
// appProjectRoot = projectRoot
interface PresetNormalizedSchema extends NormalizedSchema {
  fileSrc: string;
  projectDirectory: string;
}

function normalizeOptions(
  tree: Tree,
  options: QwikWorkspacePresetGeneratorSchema
): PresetNormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];
  const styleExtension = options.style !== 'none' ? options.style : null;
  const fileSrc = '../application/files';

  options.strict = options.strict ?? true;
  options.unitTestRunner = options.unitTestRunner ?? 'vitest';

  return {
    ...options,
    fileSrc,
    projectDirectory,
    projectName,
    appProjectRoot: projectRoot,
    offsetFromRoot: offsetFromRoot(projectRoot),
    rootTsConfigPath: getRelativePathToRootTsConfig(tree, projectRoot),
    parsedTags,
    setupVitest: options.unitTestRunner === 'vitest',
    styleExtension,
  };
}

function addFiles(tree: Tree, options: PresetNormalizedSchema) {
  const projectRoot = options.appProjectRoot;
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(projectRoot),
    template: '',
  };
  generateFiles(
    tree,
    path.join(__dirname, options.fileSrc),
    projectRoot,
    templateOptions
  );
}

export default async function (
  tree: Tree,
  options: QwikWorkspacePresetGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);
  const projectRoot = normalizedOptions.appProjectRoot;
  const tasks: GeneratorCallback[] = [];

  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: projectRoot,
    name: normalizedOptions.projectName,
    projectType: 'application',
    sourceRoot: `${projectRoot}/src`,
    targets: { build: { options: {} } },
    tags: normalizedOptions.parsedTags,
  });

  addFiles(tree, normalizedOptions);

  tasks.push(await configureVite(tree, normalizedOptions));

  tasks.push(addCommonQwikDependencies(tree));

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}
