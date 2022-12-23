import {
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
  TargetConfiguration,
} from '@nrwl/devkit';

export interface UpdateQwikAppConfigurationParams {
  projectName: string;
  projectRoot: string;
}

export function updateQwikApplicationProjectParams(
  tree: Tree,
  params: UpdateQwikAppConfigurationParams
): void {
  const projectConfig = readProjectConfiguration(tree, params.projectName);

  projectConfig.targets['build'] = getBuildTarget(params);
  projectConfig.targets['build-ssr'] = getBuildSsrTarget(params);
  projectConfig.targets['preview'] = getPreviewTarget(params);

  const serveTarget = projectConfig.targets['serve'];
  serveTarget.options['mode'] = 'ssr';

  const testTarget = projectConfig.targets['test'];
  if (testTarget?.executor === '@nrwl/vite:test') {
    testTarget.outputs = ['{workspaceRoot}/coverage/{projectRoot}'];
  }

  updateProjectConfiguration(tree, params.projectName, projectConfig);
}

function getBuildTarget(
  params: UpdateQwikAppConfigurationParams
): TargetConfiguration {
  return {
    executor: '@nrwl/vite:build',
    options: {
      outputPath: `dist/${params.projectRoot}`,
      configFile: `${params.projectRoot}/vite.config.ts`,
    },
  };
}

function getBuildSsrTarget(
  params: UpdateQwikAppConfigurationParams
): TargetConfiguration {
  return {
    executor: '@nrwl/vite:build',
    defaultConfiguration: 'preview',
    options: {
      outputPath: `dist/${params.projectRoot}`,
    },
    configurations: {
      preview: {
        ssr: 'src/entry.preview.tsx',
        mode: 'production',
      },
    },
    dependsOn: ['build'],
  };
}

function getPreviewTarget(
  params: UpdateQwikAppConfigurationParams
): TargetConfiguration {
  return {
    executor: 'nx:run-commands',
    options: {
      command: 'vite preview',
      cwd: `${params.projectRoot}`,
    },
    dependsOn: ['build-ssr'],
  };
}
