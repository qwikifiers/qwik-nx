import {
  ProjectConfiguration,
  TargetConfiguration,
  Tree,
  joinPathFragments,
} from '@nx/devkit';

export type QwikNxProjectConfiguration = ProjectConfiguration & {
  targets: Record<'build' | string, TargetConfiguration>;
};
export function isQwikNxProject(
  config: ProjectConfiguration
): config is QwikNxProjectConfiguration {
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
