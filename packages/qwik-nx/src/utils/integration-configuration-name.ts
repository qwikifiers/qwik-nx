import { ProjectConfiguration } from '@nx/devkit';

export enum IntegrationName {
  Cloudflare = 'cloudflare',
  Deno = 'deno',
  Netlify = 'netlify'
}

/**
 * If there're no integrations, the one that is being added will get a "production" mode as its configuration.
 * Otherwise the respective configuration name will be used as a configuration
 */
export function getIntegrationConfigurationName(
  integration: IntegrationName,
  project: ProjectConfiguration
): string {
  const buildTargetConfiguration =
    !!project.targets?.build?.configurations?.production;
  const buildSsrTargetConfiguration =
    !!project.targets?.['build.ssr']?.configurations?.production;

  if (buildTargetConfiguration || buildSsrTargetConfiguration) {
    return integration;
  }
  return 'production';
}
