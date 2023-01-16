import { SetupTailwindOptions } from './../setup-tailwind/schema.d';
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
import { initGenerator } from '@nrwl/vite';
import { QwikAppGeneratorSchema } from './schema';
import { Linter } from '@nrwl/linter';
import { addStyledModuleDependencies } from '../../utils/add-styled-dependencies';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { configureEslint } from '../../utils/configure-eslint';
import { addCommonQwikDependencies } from '../../utils/add-common-qwik-dependencies';
import { getQwikApplicationProjectTargets } from './utils/get-qwik-application-project-params';
import setupTailwindGenerator from '../setup-tailwind/setup-tailwind';

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

export default async function (tree: Tree, options: QwikAppGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  const tasks: GeneratorCallback[] = [];

  const targets = getQwikApplicationProjectTargets(normalizedOptions);

  if (!normalizedOptions.setupVitest) {
    delete targets['test'];
  }

  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    name: normalizedOptions.projectName,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets,
    tags: normalizedOptions.parsedTags,
  });

  addFiles(tree, normalizedOptions);

  tasks.push(
    await initGenerator(tree, {
      includeLib: false,
      uiFramework: 'none',
    })
  );

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

  if (options.tailwind) {
    const twOptions: SetupTailwindOptions = {
      project: normalizedOptions.name,
    };
    await setupTailwindGenerator(tree, twOptions);
  }

  return runTasksInSerial(...tasks);
}
