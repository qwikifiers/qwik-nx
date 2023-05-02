import { ProjectConfiguration, Tree, joinPathFragments } from '@nx/devkit';

export function isQwikNxProject(config: ProjectConfiguration): boolean {
  return config.targets?.['build']?.executor === 'qwik-nx:build';
}

export function hasCloudflareIntegration(
  tree: Tree,
  config: ProjectConfiguration
) {
  if (
    !tree.exists(joinPathFragments(config.root, 'adapters/cloudflare-pages'))
  ) {
    return false;
  }
  if (
    !tree.exists(
      joinPathFragments(config.root, 'src/entry.cloudflare-pages.tsx')
    )
  ) {
    return false;
  }
  return true;
}
