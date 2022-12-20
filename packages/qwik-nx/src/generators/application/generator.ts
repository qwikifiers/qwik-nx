import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  names,
  Tree,
} from '@nrwl/devkit';
import { NormalizedSchema, normalizeOptions } from './utils/normalize-options';
import { viteConfigurationGenerator } from '@nrwl/vite';
import { QwikAppGeneratorSchema } from './schema';
import { Linter } from '@nrwl/linter';
import { addStyledModuleDependencies } from '../../utils/add-styled-dependencies';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { configureEslint } from '../../utils/configure-eslint';
import { addCommonQwikDependencies } from '../../utils/add-common-qwik-dependencies';
import { updateQwikApplicationProjectParams } from './utils/update-qwik-application-project-params';

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    template: '',
  };
  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
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

  updateQwikApplicationProjectParams(tree, options);

  return callback;
}

export default async function (tree: Tree, options: QwikAppGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  const tasks: GeneratorCallback[] = [];

  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    name: normalizedOptions.projectName,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    // TODO: revisit later, @nrwl/vite configuration will throw if no relevant targets found
    targets: { build: { executor: '@nrwl/webpack:webpack', options: {} } },
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
