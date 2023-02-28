import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  names,
  offsetFromRoot,
  ProjectConfiguration,
  readProjectConfiguration,
  TargetConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import {
  getIntegrationConfigurationName,
  IntegrationName,
} from '../../../utils/integration-configuration-name';
import { nxCloudflareWrangler, wranglerVersion } from '../../../utils/versions';
import { CloudflarePagesIntegrationGeneratorSchema } from './schema';

interface NormalizedOptions {
  offsetFromRoot: string;
  projectConfig: ProjectConfiguration;
}

export async function cloudflarePagesIntegrationGenerator(
  tree: Tree,
  options: CloudflarePagesIntegrationGeneratorSchema
) {
  const config = readProjectConfiguration(tree, options.project);
  if (config.projectType !== 'application') {
    throw new Error(
      'Cannot setup cloudflare integration for the given project.'
    );
  }
  if (config.targets?.['build']?.executor !== 'qwik-nx:build') {
    throw new Error(
      'Project contains invalid configuration. ' +
        'If you encounter this error within a Qwik project, make sure you have run necessary Nx migrations for qwik-nx plugin.'
    );
  }

  const configurationName = getIntegrationConfigurationName(
    IntegrationName.Cloudflare,
    config
  );
  const deployTargetName = config.targets['deploy']
    ? 'deploy.cloudflare'
    : 'deploy';

  const normalizedOptions = normalizeOptions(config);
  (config.targets['build']?.configurations ?? {})[configurationName] = {};
  (config.targets['build.ssr'].configurations ??= {})[configurationName] =
    getBuildSSRTargetCloudflareConfiguration(normalizedOptions);
  config.targets[deployTargetName] = getDeployTarget(normalizedOptions);
  config.targets['preview-cloudflare'] =
    getCloudflarePreviewTarget(normalizedOptions);
  config.targets['build-cloudflare'] = getIntermediateDependsOnTarget(
    normalizedOptions,
    configurationName
  );

  updateProjectConfiguration(tree, options.project, config);

  addFiles(tree, normalizedOptions);

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return addCloudflarePagesDependencies(tree);
}

function getBuildSSRTargetCloudflareConfiguration(options: NormalizedOptions) {
  return {
    configFile: `${options.projectConfig.root}/adapters/cloudflare-pages/vite.config.ts`,
  };
}

function getDeployTarget(options: NormalizedOptions): TargetConfiguration {
  return {
    executor: '@k11r/nx-cloudflare-wrangler:deploy-page',
    options: {
      dist: `dist/${options.projectConfig.root}/client`,
    },
    dependsOn: ['build-cloudflare'],
  };
}

function getCloudflarePreviewTarget(
  options: NormalizedOptions
): TargetConfiguration {
  return {
    executor: '@k11r/nx-cloudflare-wrangler:serve-page',
    options: {
      dist: `dist/${options.projectConfig.root}/client`,
    },
    dependsOn: ['build-cloudflare'],
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
      command: `npx nx run ${options.projectConfig.name}:build:${configurationName}`,
    },
  };
}

function normalizeOptions(
  projectConfig: ProjectConfiguration
): NormalizedOptions {
  return {
    projectConfig,
    offsetFromRoot: offsetFromRoot(projectConfig.root),
  };
}

function addFiles(tree: Tree, options: NormalizedOptions): void {
  const templateOptions = {
    ...names(options.projectConfig.name!),
    projectRoot: options.projectConfig.root,
    offsetFromRoot: options.offsetFromRoot,
  };
  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    options.projectConfig.root,
    templateOptions
  );
}

function addCloudflarePagesDependencies(tree: Tree): GeneratorCallback {
  return addDependenciesToPackageJson(
    tree,
    {},
    {
      wrangler: wranglerVersion,
      '@k11r/nx-cloudflare-wrangler': nxCloudflareWrangler,
    }
  );
}

export default cloudflarePagesIntegrationGenerator;
