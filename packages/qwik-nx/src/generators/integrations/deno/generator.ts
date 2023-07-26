import {
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
import {
  getIntegrationConfigurationName,
  IntegrationName,
} from '../../../utils/integration-configuration-name';

interface NormalizedOptions extends DenoIntegrationGeneratorSchema {
  root: string;
  offsetFromRoot: string;
  config: QwikNxProjectConfiguration;
  denoRoot: string;
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
    denoProjectName: options.denoProjectName,
    root: projectConfig.root,
    offsetFromRoot: offsetFromRoot(projectConfig.root),
    config: projectConfig,
    site: options.site ?? 'yoursite.dev',
    denoRoot:
      projectConfig.targets.build.options?.['outputPath'] ??
      `dist/${projectConfig.root}`,
  };
}

function addFiles(tree: Tree, options: NormalizedOptions): void {
  const templateOptions = {
    ...names(options.project),
    projectRoot: options.root,
    offsetFromRoot: options.offsetFromRoot,
    site: options.site,
    denoProjectName: options.denoProjectName,
    denoRoot: options.denoRoot,
  };

  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    options.root,
    templateOptions
  );

  if (options.generateGithubHook) {
    generateFiles(
      tree,
      joinPathFragments(__dirname, '.github'),
      '.github',
      templateOptions
    );
  }
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

function configureProjectTargets(tree: Tree, options: NormalizedOptions) {
  const { project, config, denoProjectName, denoRoot } = options;

  // "production" if not yet created, otherwise "deno"
  const configurationName = getIntegrationConfigurationName(
    IntegrationName.Deno,
    config
  );

  // build targets
  (config.targets['build'].configurations ??= {})[configurationName] = {};
  (config.targets['build.ssr'].configurations ??= {})[configurationName] =
    getBuildSSRTargetDenoConfiguration(options);
  config.targets['build-deno'] = getIntermediateDependsOnTarget(
    options,
    configurationName
  );

  // "deploy" if not yet created, otherwise "deno.deploy"
  const deploTargetName = config.targets['deploy'] ? 'deploy.deno' : 'deploy';
  config.targets[deploTargetName] = {
    executor: 'nx:run-commands',
    options: {
      cwd: `${denoRoot}/client`,
      command: `deployctl deploy --project=${denoProjectName} https://deno.land/std/http/file_server.ts --dry-run`,
    },
    configurations: {
      preview: {
        command: `deployctl deploy --project=${denoProjectName} https://deno.land/std/http/file_server.ts`,
      },
      production: {
        command: `deployctl deploy --project=${denoProjectName} --prod https://deno.land/std/http/file_server.ts`,
      },
    },
    dependsOn: ['build-deno'],
  };

  // "preview-deno"
  config.targets['preview-deno'] = {
    executor: 'nx:run-commands',
    options: {
      command: `deno run --allow-net --allow-read --allow-env ${denoRoot}/server/entry.deno.js`,
    },
    dependsOn: ['build-deno'],
  };

  updateProjectConfiguration(tree, project, config);
}

export async function denoIntegrationGenerator(
  tree: Tree,
  options: DenoIntegrationGeneratorSchema
) {
  validateOptions(tree, options);

  const normalizedOptions = normalizeOptions(tree, options);

  configureProjectTargets(tree, normalizedOptions);

  addFiles(tree, normalizedOptions);

  if (!normalizedOptions.skipFormat) {
    await formatFiles(tree);
  }
}

export default denoIntegrationGenerator;
