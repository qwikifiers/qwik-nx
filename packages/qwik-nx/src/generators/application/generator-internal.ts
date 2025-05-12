import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  names,
  TargetConfiguration,
  Tree,
  runTasksInSerial,
} from '@nx/devkit';
import { Linter } from '@nx/eslint';
import { initGenerator } from '@nx/vite';
import { initGenerator as jsInitGenerator } from '@nx/js';
import { addCommonQwikDependencies } from '../../utils/add-common-qwik-dependencies';
import { addStyledModuleDependencies } from '../../utils/add-styled-dependencies';
import { configureEslint } from '../../utils/configure-eslint';
import setupTailwindGenerator from '../setup-tailwind/setup-tailwind';
import { SetupTailwindOptions } from './../setup-tailwind/schema.d';
import { NormalizedSchema, QwikAppGeneratorSchema } from './schema';
import { getQwikApplicationProjectTargets } from './utils/get-qwik-application-project-params';
import { normalizeOptions } from './utils/normalize-options';
import { addE2eProject } from './utils/add-e2e';

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name || options.projectName),
    template: '',
  };
  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
}

export async function appGeneratorInternal(
  tree: Tree,
  options: QwikAppGeneratorSchema
) {
  const tasks: GeneratorCallback[] = [];

  const normalizedOptions = await normalizeOptions(tree, options);

  const targets: Record<string, TargetConfiguration> =
    getQwikApplicationProjectTargets(normalizedOptions);

  if (!normalizedOptions.setupVitest) {
    delete targets['test'];
  }

  await jsInitGenerator(tree, {
    skipFormat: true,
  });

  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    name: normalizedOptions.projectName,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets,
    tags: normalizedOptions.parsedTags,
  });

  addFiles(tree, normalizedOptions);

  // TODO: keeping them for compatibility with nx <17.3.0
  const deprecatedOptions = {
    includeLib: false,
    uiFramework: 'none',
    testEnvironment: 'node',
  };
  tasks.push(
    await initGenerator(tree, {
      ...deprecatedOptions,
      keepExistingVersions: true,
    })
  );

  if (normalizedOptions.linter === Linter.EsLint) {
    tasks.push(
      await configureEslint(tree, normalizedOptions.projectName, true)
    );
  }

  if (normalizedOptions.styleExtension) {
    tasks.push(
      addStyledModuleDependencies(tree, normalizedOptions.styleExtension)
    );
  }

  tasks.push(addCommonQwikDependencies(tree));

  if (
    normalizedOptions.e2eTestRunner &&
    normalizedOptions.e2eTestRunner !== 'none'
  ) {
    const e2eProjectTask = await addE2eProject(tree, normalizedOptions);
    tasks.push(e2eProjectTask);
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  if (options.tailwind) {
    const twOptions: SetupTailwindOptions = {
      project: normalizedOptions.name,
    };
    tasks.push(await setupTailwindGenerator(tree, twOptions));
  }

  return runTasksInSerial(...tasks);
}
