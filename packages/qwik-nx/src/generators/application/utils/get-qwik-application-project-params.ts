import { TargetConfiguration } from '@nrwl/devkit';

export interface UpdateQwikAppConfigurationParams {
  projectName: string;
  projectRoot: string;
  offsetFromRoot: string;
}

export function getQwikApplicationProjectTargets(
  params: UpdateQwikAppConfigurationParams
) {
  return {
    build: getBuildTarget(params),
    'build-ssr': getBuildSsrTarget(params),
    preview: getPreviewTarget(params),
    test: getTestTarget(params),
    serve: getServeTarget(params),
    serveDebug: getServeDebugTarget(params),
  };
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
function getTestTarget(
  params: UpdateQwikAppConfigurationParams
): TargetConfiguration {
  return {
    executor: '@nrwl/vite:test',
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
    executor: '@nrwl/vite:dev-server',
    defaultConfiguration: 'development',
    options: {
      buildTarget: `${params.projectName}:build`,
      mode: 'ssr',
    },
    configurations: {
      development: {
        buildTarget: `${params.projectName}:build:development`,
        hmr: true,
      },
      production: {
        buildTarget: `${params.projectName}:build:production`,
        hmr: false,
      },
    },
  };
}

function getServeDebugTarget(
  params: UpdateQwikAppConfigurationParams
): TargetConfiguration {
  return {
    executor: 'nx:run-commands',
    options: {
      command: `node --inspect-brk ${params.offsetFromRoot}/node_modules/vite/bin/vite.js --mode ssr --force`,
      cwd: params.projectRoot,
    },
  };
}
