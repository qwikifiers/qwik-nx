import {
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
import { Linter } from '@nrwl/linter';
import { libraryGenerator as nxLibraryGenerator } from '@nrwl/workspace/generators';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { getRelativePathToRootTsConfig } from '@nrwl/workspace/src/utilities/typescript';
import { LibraryGeneratorSchema } from './schema';
import componentGenerator from './../component/generator';
import { configureEslint } from '../../utils/configure-eslint';
import { initGenerator } from '@nrwl/vite';
import { addCommonQwikDependencies } from '../../utils/add-common-qwik-dependencies';
import { getQwikLibProjectTargets } from './utils/get-qwik-lib-project-params';
import { ensureTsConfigBaseExists } from '../../utils/ensure-tsconfig-base-exists';

interface NormalizedSchema extends LibraryGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
  offsetFromRoot: string;
  setupVitest: boolean;
}

function normalizeOptions(
  tree: Tree,
  schema: LibraryGeneratorSchema
): NormalizedSchema {
  const name = names(schema.name).fileName;
  const projectDirectory = schema.directory
    ? `${names(schema.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;
  const parsedTags = schema.tags
    ? schema.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...schema,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    setupVitest: schema.unitTestRunner === 'vitest',
    offsetFromRoot: offsetFromRoot(projectRoot),
  };
}

export async function libraryGenerator(
  tree: Tree,
  schema: LibraryGeneratorSchema
) {
  const options = normalizeOptions(tree, schema);
  const tasks: GeneratorCallback[] = [];

  ensureTsConfigBaseExists(tree);

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
  nxLibraryGenerator(tree, {
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
  const callback = await componentGenerator(tree, {
    name: options.name,
    skipTests: options.unitTestRunner !== 'vitest',
    style: options.style,
    project: options.projectName,
    flat: true,
  });

  return callback;
}

async function configureVite(tree: Tree, options: NormalizedSchema) {
  const callback = await initGenerator(tree, {
    uiFramework: 'none',
    includeLib: true,
  });

  const projectConfig = readProjectConfiguration(tree, options.projectName);

  const targets = getQwikLibProjectTargets(options);

  projectConfig.targets ??= {};

  projectConfig.targets['build'] = targets.build;

  if (options.setupVitest) {
    projectConfig.targets['test'] = targets.test;
  } else {
    tree.delete(`${options.projectRoot}/tsconfig.spec.json`);
  }

  updateProjectConfiguration(tree, options.projectName, projectConfig);

  return callback;
}

export default libraryGenerator;
