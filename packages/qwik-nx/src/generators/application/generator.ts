import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  names,
  Tree,
} from '@nrwl/devkit';
import { Linter } from '@nrwl/linter';
import { initGenerator } from '@nrwl/vite';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { addCommonQwikDependencies } from '../../utils/add-common-qwik-dependencies';
import { addStyledModuleDependencies } from '../../utils/add-styled-dependencies';
import { configureEslint } from '../../utils/configure-eslint';
import setupTailwindGenerator from '../setup-tailwind/setup-tailwind';
import { SetupTailwindOptions } from './../setup-tailwind/schema.d';
import { addE2eProject } from './lib/add-e2e-project';
import { NormalizedSchema, QwikAppGeneratorSchema } from './schema';
import { getQwikApplicationProjectTargets } from './utils/get-qwik-application-project-params';
import { normalizeOptions } from './utils/normalize-options';

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

  const e2eProjectTask = await addE2eProject(tree, normalizedOptions);
  tasks.push(e2eProjectTask);

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
