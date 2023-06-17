import {
  ensurePackage,
  formatFiles,
  generateFiles,
  joinPathFragments,
  names,
  offsetFromRoot,
  readProjectConfiguration,
  TargetConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { DenoIntegrationGeneratorSchema } from './schema';
import {
  isQwikNxProject,
  QwikNxProjectConfiguration,
} from '../../../utils/migrations';
import { getInstalledNxVersion } from '../../../utils/get-installed-nx-version';
import {
  getIntegrationConfigurationName,
  IntegrationName,
} from '../../../utils/integration-configuration-name';

interface NormalizedOptions extends DenoIntegrationGeneratorSchema {
  root: string;
  offsetFromRoot: string;
  config: QwikNxProjectConfiguration;
}

function validateOptions(
  tree: Tree,
  options: DenoIntegrationGeneratorSchema
): void {
  const config = readProjectConfiguration(tree, options.project);
  if (config.projectType !== 'application') {
    throw new Error('Cannot setup deno integration for the given project.');
  }
  if (!isQwikNxProject(config)) {
    throw new Error(
      'Project contains invalid configuration. ' +
        'If you encounter this error within a Qwik project, make sure you have run necessary Nx migrations for qwik-nx plugin.'
    );
  }
}

function normalizeOptions(
  tree: Tree,
  options: DenoIntegrationGeneratorSchema
): NormalizedOptions {
  const projectConfig = readProjectConfiguration(
    tree,
    options.project
  ) as QwikNxProjectConfiguration;
  return {
    ...options,
    deployTarget: options.deployTarget,
    serveTarget: options.serveTarget,
    denoProjectName: options.denoProjectName,
    root: projectConfig.root,
    offsetFromRoot: offsetFromRoot(projectConfig.root),
    config: projectConfig,
    site: options.site ?? 'yoursite.dev',
  };
}

function addFiles(tree: Tree, options: NormalizedOptions): void {
  const templateOptions = {
    ...names(options.project),
    projectRoot: options.root,
    offsetFromRoot: options.offsetFromRoot,
    site: options.site,
    denoProjectName: options.denoProjectName,
    denoRoot: `${
      options.config.targets.build.options?.['outputPath'] ??
      `dist/${options.config.root}`
    }/client`,
  };

  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    options.root,
    templateOptions
  );
}

function getBuildSSRTargetDenoConfiguration(options: NormalizedOptions) {
  return {
    configFile: `${options.root}/adapters/deno/vite.config.ts`,
  };
}

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

function addBuildConfigurations(tree: Tree, options: NormalizedOptions) {
  const { project, config } = options;

  const configurationName = getIntegrationConfigurationName(
    IntegrationName.Deno,
    config
  );

  (config.targets['build'].configurations ??= {})[configurationName] = {};
  (config.targets['build.ssr'].configurations ??= {})[configurationName] =
    getBuildSSRTargetDenoConfiguration(options);
  config.targets['build.deno'] = getIntermediateDependsOnTarget(
    options,
    configurationName
  );

  updateProjectConfiguration(tree, project, config);
}

function addDeployTarget(tree: Tree, options: NormalizedOptions) {
  const { deployTarget, project, denoProjectName, config } = options;

  const configurationName = getIntegrationConfigurationName(
    IntegrationName.Deno,
    config
  );

  config.targets[deployTarget] = {
    executor: 'nx:run-commands',
    options: {
      command: `deployctl deploy --project=${denoProjectName} https://deno.land/std/http/file_server.ts --dry-run`,
    },
    configurations: {
      preview: {
        command: `deployctl deploy --project=${denoProjectName} https://deno.land/std/http/file_server.ts`,
      },
      [configurationName]: {
        command: `deployctl deploy --project=${denoProjectName} --prod https://deno.land/std/http/file_server.ts`,
      },
    },
  };

  updateProjectConfiguration(tree, project, config);
}

export async function denoIntegrationGenerator(
  tree: Tree,
  options: DenoIntegrationGeneratorSchema
) {
  validateOptions(tree, options);

  ensurePackage('@nx/deno', getInstalledNxVersion(tree));

  const normalizedOptions = normalizeOptions(tree, options);

  addBuildConfigurations(tree, normalizedOptions);

  addFiles(tree, normalizedOptions);

  addDeployTarget(tree, normalizedOptions);

  if (!normalizedOptions.skipFormat) {
    await formatFiles(tree);
  }
}

export default denoIntegrationGenerator;
