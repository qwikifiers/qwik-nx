import { TargetConfiguration } from '@nx/devkit';

export interface UpdateQwikAppConfigurationParams {
  projectName: string;
  projectRoot: string;
  offsetFromRoot: string;
  devServerPort?: number;
  previewServerPort?: number;
}

export function getQwikApplicationProjectTargets(
  params: UpdateQwikAppConfigurationParams
): Record<string, TargetConfiguration> {
  return {
    build: getBuildTarget(params),
    'build.client': getBuildClientTarget(params),
    'build.ssr': getBuildSsrTarget(params),
    preview: getPreviewTarget(params),
    test: getTestTarget(params),
    serve: getServeTarget(params),
    'serve.debug': getServeDebugTarget(params),
  };
}

function getBuildTarget(
  params: UpdateQwikAppConfigurationParams
): TargetConfiguration {
  return {
    executor: 'qwik-nx:build',
    options: {
      runSequence: [
        `${params.projectName}:build.client`,
        `${params.projectName}:build.ssr`,
      ],
      outputPath: `dist/${params.projectRoot}`,
    },
    configurations: {
      preview: {},
    },
  };
}

function getBuildClientTarget(
  params: UpdateQwikAppConfigurationParams
): TargetConfiguration {
  return {
    executor: '@nx/vite:build',
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
    executor: '@nx/vite:build',
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
  };
}

function getPreviewTarget(
  params: UpdateQwikAppConfigurationParams
): TargetConfiguration {
  return {
    executor: '@nx/vite:preview-server',
    options: {
      buildTarget: `${params.projectName}:build`,
      port: params.previewServerPort,
    },
  };
}

function getTestTarget(
  params: UpdateQwikAppConfigurationParams
): TargetConfiguration {
  return {
    executor: '@nx/vite:test',
    outputs: [`${params.offsetFromRoot}coverage/${params.projectRoot}`],
    options: {
      passWithNoTests: true,
      reportsDirectory: `${params.offsetFromRoot}coverage/${params.projectRoot}`,
    },
  };
}

function getServeTarget(
  params: UpdateQwikAppConfigurationParams
): TargetConfiguration {
  return {
    executor: '@nx/vite:dev-server',
    options: {
      buildTarget: `${params.projectName}:build.client`,
      mode: 'ssr',
      port: params.devServerPort,
    },
  };
}

function getServeDebugTarget(
  params: UpdateQwikAppConfigurationParams
): TargetConfiguration {
  return {
    executor: 'nx:run-commands',
    options: {
      command: `node --inspect-brk ${params.offsetFromRoot}node_modules/vite/bin/vite.js --mode ssr --force`,
      cwd: params.projectRoot,
    },
  };
}
