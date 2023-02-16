import {
  GeneratorCallback,
  Tree,
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  joinPathFragments,
  logger,
  readProjectConfiguration,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import {
  autoprefixerVersion,
  postcssVersion,
  tailwindcssVersion,
} from '../../utils/versions';
import type { SetupTailwindOptions } from './schema';
import { addTailwindStyleImports } from './lib/add-tailwind-style-imports';

export async function setupTailwindGenerator(
  tree: Tree,
  options: SetupTailwindOptions
): Promise<GeneratorCallback> {
  const tasks: GeneratorCallback[] = [];
  const project = readProjectConfiguration(tree, options.project);

  if (
    tree.exists(joinPathFragments(project.root, 'postcss.config.js')) ||
    tree.exists(joinPathFragments(project.root, 'tailwind.config.js'))
  ) {
    logger.info(
      `Skipping setup since there are existing PostCSS or Tailwind configuration files. For manual setup instructions, see https://qwik.builder.io/integrations/integration/tailwind/.`
    );
    return () => void 0;
  }

  generateFiles(tree, joinPathFragments(__dirname, './files'), project.root, {
    tmpl: '',
  });

  addTailwindStyleImports(tree, project);

  if (!options.skipPackageJson) {
    tasks.push(
      addDependenciesToPackageJson(
        tree,
        {},
        {
          autoprefixer: autoprefixerVersion,
          postcss: postcssVersion,
          tailwindcss: tailwindcssVersion,
        }
      )
    );
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}

export default setupTailwindGenerator;
