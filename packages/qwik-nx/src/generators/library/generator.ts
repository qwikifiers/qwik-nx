import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { Linter } from '@nrwl/linter';
import { libraryGenerator } from '@nrwl/workspace/generators';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { getRelativePathToRootTsConfig } from '@nrwl/workspace/src/utilities/typescript';
import * as path from 'path';
import { addViteBase } from '../../utils/add-vite-base';
import { vitestVersion } from '../../utils/versions';
import { LibraryGeneratorSchema } from './schema';
import componentGenerator from './../component/generator'

interface NormalizedSchema extends LibraryGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
  offsetFromRoot: string;
}

function normalizeOptions(tree: Tree, schema: LibraryGeneratorSchema): NormalizedSchema {
  const name = names(schema.name).fileName;
  const projectDirectory = schema.directory ? `${names(schema.directory).fileName}/${name}` : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;
  const parsedTags = schema.tags ? schema.tags.split(',').map((s) => s.trim()) : [];

  return {
    ...schema,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    offsetFromRoot: offsetFromRoot(projectRoot),
  };
}

export default async function (tree: Tree, schema: LibraryGeneratorSchema) {
  const options = normalizeOptions(tree, schema);
  const tasks: GeneratorCallback[] = [];

  addLibrary(tree,options);

  const configuration = readProjectConfiguration(tree, options.projectName);

  if (options.linter === Linter.EsLint) {
    configuration.targets.lint.options.lintFilePatterns = [`${options.projectRoot}/**/*.{ts,tsx,js,jsx}`];
  }

  if (options.unitTestRunner === 'vitest') {
    tasks.push(addDependenciesToPackageJson( tree, { vitest: vitestVersion, }, {} ))
    configuration.targets['test'] = {
      executor: 'nx:run-commands',
      options: {
        command: `vitest -c ${options.projectRoot}/vite.config.ts --run`,
      },
    };
  }

  updateProjectConfiguration(tree, options.projectName, configuration);
  
  addViteBase(tree);
  if (!options.skipFormat) {
    await formatFiles(tree);
  }
  return runTasksInSerial(...tasks);
}

function addLibrary(tree: Tree, options: NormalizedSchema) {
  libraryGenerator(tree, {
    ...options,
    unitTestRunner: 'none',
    skipBabelrc: true,
    skipFormat: true
  });
  tree.delete(`${options.projectRoot}/src/lib/${options.name}.ts`);

  const templateOptions = {
    ...options,
    ...names(options.name),
    strict: !!options.strict,
    hasUnitTests: options.unitTestRunner === 'vitest',
    rootTsConfigPath: getRelativePathToRootTsConfig(tree, options.projectRoot),
  };
  generateFiles(tree, path.join(__dirname, 'files'), options.projectRoot, templateOptions);
  componentGenerator(tree, {
    name: options.name, 
    skipTests: options.unitTestRunner !== 'vitest',
    style: options.style,
    project: options.projectName,
    flat: true
  })
}
