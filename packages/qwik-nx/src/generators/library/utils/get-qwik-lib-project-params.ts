import { TargetConfiguration } from '@nrwl/devkit';

export interface UpdateQwikAppConfigurationParams {
  projectRoot: string;
  offsetFromRoot: string;
}

export function getQwikLibProjectTargets(
  params: UpdateQwikAppConfigurationParams
) {
  return {
    build: getBuildTarget(params),
    test: getTestTarget(params),
  };
}

function getBuildTarget(
  params: UpdateQwikAppConfigurationParams
): TargetConfiguration {
  return {
    executor: '@nrwl/vite:build',
    outputs: ['{options.outputPath}'],
    options: {
      outputPath: `dist/${params.projectRoot}`,
      configFile: `${params.projectRoot}/vite.config.ts`,
      mode: 'lib',
    },
  };
}

function getTestTarget(
  params: UpdateQwikAppConfigurationParams
): TargetConfiguration {
  return {
    executor: '@nrwl/vite:test',
    outputs: [`${params.offsetFromRoot}/coverage/${params.projectRoot}`],
    options: {
      passWithNoTests: true,
      reportsDirectory: `${params.offsetFromRoot}coverage/${params.projectRoot}`,
    },
  };
}
