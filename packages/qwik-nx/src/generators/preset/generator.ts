import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { addCommonQwikDependencies } from '../../utils/add-common-qwik-dependencies';
import { addStyledModuleDependencies } from '../../utils/add-styled-dependencies';
import { configureEslint } from '../../utils/configure-eslint';
import { Linter } from '@nrwl/linter';
import { QwikPresetGeneratorSchema } from './schema';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { viteConfigurationGenerator } from '@nrwl/vite';
import * as path from 'path';
import { getRelativePathToRootTsConfig } from '@nrwl/workspace/src/utilities/typescript';

interface NormalizedSchema extends QwikPresetGeneratorSchema {
  parsedTags: string[];
  projectDirectory: string;
  projectName: string;
  projectRoot: string;
  offsetFromRoot: string;
  rootTsConfigPath: string;
  setupVitest: boolean;
  styleExtension: Exclude<QwikPresetGeneratorSchema['style'], 'none'> | null;
}

function normalizeOptions(
  tree: Tree,
  options: QwikPresetGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];
  const projectDirectory = name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`;
  const styleExtension = options.style !== 'none' ? options.style : null;

  options.strict = options.strict ?? true;
  options.unitTestRunner = options.unitTestRunner ?? 'vitest';

  return {
    ...options,
    projectName,
    projectRoot,
    offsetFromRoot: offsetFromRoot(projectRoot),
    rootTsConfigPath: getRelativePathToRootTsConfig(tree, projectRoot),
    projectDirectory,
    parsedTags,
    styleExtension,
    setupVitest: options.unitTestRunner === 'vitest',
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
}

async function configureVite(
  tree: Tree,
  options: NormalizedSchema
): Promise<GeneratorCallback> {
  const tsConfigPath = joinPathFragments(options.projectRoot, 'tsconfig.json');
  const tsConfig = tree.read(tsConfigPath);
  const includeVitest = options.unitTestRunner === 'vitest';

  const callback = await viteConfigurationGenerator(tree, {
    project: options.projectName,
    newProject: false,
    includeVitest,
    includeLib: false,
    uiFramework: 'none',
    inSourceTests: false,
  });
  tree.delete(joinPathFragments(options.projectRoot, 'index.html'));

  // overwrite tsconfig back after "viteConfigurationGenerator"
  tree.write(tsConfigPath, tsConfig);

  if (includeVitest) {
    const projectConfig = readProjectConfiguration(tree, options.projectName);
    const testTarget = projectConfig.targets['test'];
    testTarget.outputs = ['{workspaceRoot}/coverage/{projectRoot}'];
    updateProjectConfiguration(tree, options.projectName, projectConfig);
  }

  return callback;
}

export default async function (tree: Tree, options: QwikPresetGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  const tasks: GeneratorCallback[] = [];

  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    name: normalizedOptions.projectName,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: { build: { options: {} } },
    tags: normalizedOptions.parsedTags,
  });

  addFiles(tree, normalizedOptions);

  tasks.push(await configureVite(tree, normalizedOptions));

  if (normalizedOptions.linter === Linter.EsLint) {
    tasks.push(configureEslint(tree, normalizedOptions.projectName, true));
  }

  if (normalizedOptions.style !== 'none') {
    tasks.push(
      addStyledModuleDependencies(tree, normalizedOptions.styleExtension)
    );
  }

  tasks.push(addCommonQwikDependencies(tree));

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}
