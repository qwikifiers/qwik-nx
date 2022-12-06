import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  names,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { NormalizedSchema, normalizeOptions } from './utils/normalize-options';
import { viteConfigurationGenerator } from '@nrwl/vite';
import { QwikAppGeneratorSchema } from './schema';
import { Linter } from '@nrwl/linter';
import { addStyledModuleDependencies } from '../../utils/add-styled-dependencies';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { configureEslint } from '../../utils/configure-eslint';
import { addCommonQwikDependencies } from '../../utils/add-common-qwik-dependencies';

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    template: '',
  };
  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    options.appProjectRoot,
    templateOptions
  );
}

async function configureVite(
  tree: Tree,
  options: NormalizedSchema
): Promise<GeneratorCallback> {
  const tsConfigPath = joinPathFragments(
    options.appProjectRoot,
    'tsconfig.json'
  );
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
  tree.delete(joinPathFragments(options.appProjectRoot, 'index.html'));

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

export default async function (tree: Tree, options: QwikAppGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  const tasks: GeneratorCallback[] = [];

  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.appProjectRoot,
    name: normalizedOptions.projectName,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.appProjectRoot}/src`,
    // TODO: revisit later, now "viteConfigurationGenerator" will fail if there's no build target specified
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
