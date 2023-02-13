import {
  formatFiles,
  joinPathFragments,
  logger,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { addSsgFiles } from './lib/add-ssg-files';
import { NormalizedSchema, SetupSsgGeneratorSchema } from './schema';

function normalizeOptions(
  tree: Tree,
  options: SetupSsgGeneratorSchema
): NormalizedSchema {
  const project = readProjectConfiguration(tree, options.project);
  const projectRoot = project.root;

  return {
    ...options,
    projectRoot,
  };
}

export async function setupSsgGenerator(
  tree: Tree,
  options: SetupSsgGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);

  const { projectRoot } = normalizedOptions;

  const ssgConfigPath = joinPathFragments(
    projectRoot,
    'adapters',
    'static',
    'vite.config.ts'
  );

  if (tree.exists(ssgConfigPath)) {
    logger.info(
      `Skipping setup since there is an existing static adapter configuration. For more configuration, see https://qwik.builder.io/qwikcity/guides/static-site-generation/.`
    );
    return;
  }

  const projectConfig = readProjectConfiguration(tree, options.project);

  addSsgFiles(tree, normalizedOptions);

  updateProjectConfiguration(tree, options.project, {
    ...projectConfig,
    targets: {
      ...projectConfig.targets,
      'build-server': {
        executor: '@nrwl/vite:build',
        options: {
          outputPath: 'dist/docs',
          configFile: ssgConfigPath,
        },
      },
    },
  });

  await formatFiles(tree);
}

export default setupSsgGenerator;
