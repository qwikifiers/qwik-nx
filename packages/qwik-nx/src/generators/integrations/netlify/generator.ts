import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  joinPathFragments,
  logger,
  names,
  offsetFromRoot,
  readProjectConfiguration,
  TargetConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import {
  getIntegrationConfigurationName,
  IntegrationName,
} from '../../../utils/integration-configuration-name';
import { NetlifyIntegrationGeneratorSchema } from './schema';
import {
  isQwikNxProject,
  QwikNxProjectConfiguration,
} from '../../../utils/migrations';
import { netlifyCliVersion } from '../../../utils/versions';

interface NormalizedOptions extends NetlifyIntegrationGeneratorSchema {
  root: string;
  offsetFromRoot: string;
}

function validateOptions(
  tree: Tree,
  options: NetlifyIntegrationGeneratorSchema
): void {
  const config = readProjectConfiguration(tree, options.project);
  if (config.projectType !== 'application') {
    throw new Error('Cannot setup netlify integration for the given project.');
  }
  if (!isQwikNxProject(config)) {
    throw new Error(
      'Project contains invalid configuration. ' +
        'If you encounter this error within a Qwik project, make sure you have run necessary Nx migrations for qwik-nx plugin.'
    );
  }
}
function getBuildSSRTargetNetlifyConfiguration(options: NormalizedOptions) {
  return {
    configFile: `${options.root}/adapters/netlify/vite.config.ts`,
  };
}

/** Currently it's not possible to depend on a target with a specific configuration, that's why intermediate one is required */
function getIntermediateDependsOnTarget(
  options: NormalizedOptions,
  configurationName: string
): TargetConfiguration {
  return {
    executor: 'nx:run-commands',
    options: {
      command: `npx nx run ${options.project}:build:${configurationName}`,
    },
  };
}

function getDeployTarget(options: NormalizedOptions): TargetConfiguration {
  return {
    executor: 'qwik-nx:exec',
    options: {
      command: `npx netlify deploy --build --dir=client`,
      cwd: joinPathFragments('dist', options.root),
    },
    dependsOn: ['build-netlify'],
  };
}

function getNetlifyPreviewTarget(
  options: NormalizedOptions
): TargetConfiguration {
  return {
    executor: 'qwik-nx:exec',
    options: {
      command: `npx netlify dev --dir=client`,
      cwd: joinPathFragments('dist', options.root),
    },
    dependsOn: ['build-netlify'],
  };
}

function normalizeOptions(
  tree: Tree,
  options: NetlifyIntegrationGeneratorSchema
): NormalizedOptions {
  const projectConfig = readProjectConfiguration(tree, options.project);
  return {
    ...options,
    root: projectConfig.root,
    offsetFromRoot: offsetFromRoot(projectConfig.root),
  };
}

function installDependencies(tree: Tree) {
  return addDependenciesToPackageJson(
    tree,
    {},
    {
      'netlify-cli': netlifyCliVersion,
    }
  );
}

function addFiles(tree: Tree, options: NormalizedOptions): void {
  const templateOptions = {
    ...names(options.project!),
    projectRoot: options.root,
    offsetFromRoot: options.offsetFromRoot,
  };
  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    options.root,
    templateOptions
  );
  addGitIgnoreEntry(tree);
}

function addGitIgnoreEntry(tree: Tree) {
  if (!tree.exists('.gitignore')) {
    logger.warn(`Couldn't find .gitignore file to update`);
    return;
  }

  let content = tree.read('.gitignore')?.toString('utf-8').trimEnd() ?? '';

  let gitIgnoreEntryForNetlify = '# Local Netlify folder\n.netlify\n';
  if (content) {
    gitIgnoreEntryForNetlify = '\n\n' + gitIgnoreEntryForNetlify;
  }

  if (!/\.netilify\/$/gm.test(content)) {
    content = `${content}${gitIgnoreEntryForNetlify}`;
    tree.write('.gitignore', content);
  }
}

export async function netlifyIntegrationGenerator(
  tree: Tree,
  schema: NetlifyIntegrationGeneratorSchema
) {
  validateOptions(tree, schema);

  const normalizedOptions = normalizeOptions(tree, schema);

  const config = readProjectConfiguration(
    tree,
    normalizedOptions.project
  ) as QwikNxProjectConfiguration;

  const configurationName = getIntegrationConfigurationName(
    IntegrationName.Netlify,
    config
  );

  (config.targets['build'].configurations ??= {})[configurationName] = {};
  (config.targets['build.ssr'].configurations ??= {})[configurationName] =
    getBuildSSRTargetNetlifyConfiguration(normalizedOptions);
  config.targets['build-netlify'] = getIntermediateDependsOnTarget(
    normalizedOptions,
    configurationName
  );
  config.targets['deploy-netlify'] = getDeployTarget(normalizedOptions);
  config.targets['preview-netlify'] =
    getNetlifyPreviewTarget(normalizedOptions);

  updateProjectConfiguration(tree, normalizedOptions.project, config);

  addFiles(tree, normalizedOptions);

  if (!normalizedOptions.skipFormat) {
    await formatFiles(tree);
  }

  return installDependencies(tree);
}

export default netlifyIntegrationGenerator;
