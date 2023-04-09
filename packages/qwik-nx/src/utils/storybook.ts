import type { PluginOption, UserConfig } from 'vite';

/** Updates config for the storybook */
export function withNx(config: UserConfig): UserConfig {
  const updated = { ...config };
  // logic below has been copied from "storybook-framework-qwik" plugin
  // it doesn't work out of the box for Nx applications because base config is not
  // Qwik-city plugin may be used in apps, but it has mdx stuff that conflicts with Storybook mdx
  // we'll try to only remove the transform code (where the mdx stuff is), and keep everything else.
  updated.plugins = updated.plugins?.map((plugin: PluginOption) =>
    (plugin as any)?.name === 'vite-plugin-qwik-city'
      ? ({ ...plugin, transform: () => null } as PluginOption)
      : plugin
  );
  return updated;
}
