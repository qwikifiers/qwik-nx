import {
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  names,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { Linter } from '@nrwl/linter';
import { libraryGenerator as nxLibraryGenerator } from '@nrwl/workspace/generators';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import {
  getRelativePathToRootTsConfig,
  initGenerator as jsInitGenerator,
} from '@nrwl/js';
import { LibraryGeneratorSchema, NormalizedSchema } from './schema';
import componentGenerator from './../component/generator';
import { configureEslint } from '../../utils/configure-eslint';
import { initGenerator } from '@nrwl/vite';
import { addCommonQwikDependencies } from '../../utils/add-common-qwik-dependencies';
import { getQwikLibProjectTargets } from './utils/get-qwik-lib-project-params';
import { normalizeOptions } from './utils/normalize-options';

export async function libraryGenerator(
  tree: Tree,
  schema: LibraryGeneratorSchema
) {
  const options = normalizeOptions(tree, schema);
  const tasks: GeneratorCallback[] = [];

  await jsInitGenerator(tree, {
    skipFormat: true,
  });

  tasks.push(await addLibrary(tree, options));

  tasks.push(await configureVite(tree, options));

  if (options.linter === Linter.EsLint) {
    tasks.push(configureEslint(tree, options.projectName, true));
  }

  tasks.push(addCommonQwikDependencies(tree));

  if (!options.skipFormat) {
    await formatFiles(tree);
  }
  return runTasksInSerial(...tasks);
}

async function addLibrary(
  tree: Tree,
  options: NormalizedSchema
): Promise<GeneratorCallback> {
  const tasks = [];
  const libGeneratorTask = await nxLibraryGenerator(tree, {
    name: options.name,
    directory: options.directory,
    tags: options.tags,
    linter: Linter.None,
    importPath: options.importPath,
    strict: options.strict,
    standaloneConfig: options.standaloneConfig,
    unitTestRunner: 'none',
    skipBabelrc: true,
    skipFormat: true,
  });
  tasks.push(libGeneratorTask);

  tree.delete(`${options.projectRoot}/src/lib/${options.name}.ts`);

  const templateOptions = {
    ...options,
    ...names(options.name),
    strict: !!options.strict,
    rootTsConfigPath: getRelativePathToRootTsConfig(tree, options.projectRoot),
  };
  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );

  if (!options.setupVitest) {
    tree.delete(`${options.projectRoot}/tsconfig.spec.json`);
  }

  if (!options.buildable) {
    tree.delete(`${options.projectRoot}/package.json`);
    if (!options.setupVitest) {
      tree.delete(`${options.projectRoot}/vite.config.ts`);
    }
  }

  const componentGeneratorTask = await componentGenerator(tree, {
    name: options.name,
    skipTests: !options.setupVitest,
    style: options.style,
    project: options.projectName,
    flat: true,
  });

  tasks.push(componentGeneratorTask);

  return runTasksInSerial(...tasks);
}

async function configureVite(tree: Tree, options: NormalizedSchema) {
  const callback = await initGenerator(tree, {
    uiFramework: 'none',
    includeLib: true,
  });

  const projectConfig = readProjectConfiguration(tree, options.projectName);

  projectConfig.targets = {
    ...projectConfig.targets,
    ...getQwikLibProjectTargets(options),
  };

  updateProjectConfiguration(tree, options.projectName, projectConfig);

  return callback;
}

export default libraryGenerator;
