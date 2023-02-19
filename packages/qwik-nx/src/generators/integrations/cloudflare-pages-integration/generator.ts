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
  config.targets ??= {};

  if (config.projectType !== 'application' || !config.targets['build-ssr']) {
    throw new Error(
      'Cannot setup cloudflare integration for the given project.'
    );
  }
  if (config.targets['deploy']) {
    throw new Error(
      `"deploy" target has already been configured for ${options.project}`
    );
  }

  const normalizedOptions = normalizeOptions(config);
  (config.targets['build-ssr'].configurations ??= {})['cloudflare-pages'] =
    getBuildSSRTargetCloudflareConfiguration(normalizedOptions);
  config.targets['deploy'] = getDeployTarget(normalizedOptions);
  config.targets['preview-cloudflare-pages'] =
    getCloudflarePreviewTarget(normalizedOptions);
  config.targets['build-ssr-cloudflare-pages'] =
    getIntermediateDependsOnTarget(normalizedOptions);

  updateProjectConfiguration(tree, options.project, config);

  addFiles(tree, normalizedOptions);

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return addCloudflarePagesDependencies(tree);
}

function getBuildSSRTargetCloudflareConfiguration(options: NormalizedOptions) {
  return {
    configFile: `${options.projectConfig.root}/adaptors/cloudflare-pages/vite.config.ts`,
  };
}

function getDeployTarget(options: NormalizedOptions): TargetConfiguration {
  return {
    executor: '@k11r/nx-cloudflare-wrangler:deploy-page',
    options: {
      dist: `dist/${options.projectConfig.root}/client`,
    },
    dependsOn: ['build-ssr-cloudflare-pages'],
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
    dependsOn: ['build-ssr-cloudflare-pages'],
  };
}

/** Currently it's not possible to depend on a target with a specific configuration, that's why intermediate one is required */
function getIntermediateDependsOnTarget(
  options: NormalizedOptions
): TargetConfiguration {
  return {
    executor: 'nx:run-commands',
    options: {
      command: `npx nx run ${options.projectConfig.name}:build-ssr:cloudflare-pages`,
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
