import { PluginOption, UserConfig, mergeConfig } from 'vite';
import {
  type QwikVitePluginOptions,
  qwikVite,
} from '@builder.io/qwik/optimizer';

/**
 * Updates config for the storybook
 * @param config vite configuration to be updated for storybook
 * @param qwikViteOpts options for the `qwikVite` plugin that is being overridden in this utility
 */
export function withNx(
  config: UserConfig,
  qwikViteOpts?: QwikVitePluginOptions
): UserConfig {
  const updated: UserConfig = mergeConfig(config, {
    build: {
      rollupOptions: {
        external: ['@qwik-city-sw-register'],
      },
    },
  });
  updated.plugins = updated.plugins?.flat(10).map((plugin: PluginOption) => {
    switch ((plugin as any)?.name) {
      case 'vite-plugin-qwik':
        // as of now there's no way of extending qwikVite with overridden output paths, thus have to override to completely
        return qwikVite(qwikViteOpts);

      case 'vite-plugin-qwik-city':
        // logic below has been copied from "storybook-framework-qwik" plugin
        // it doesn't work out of the box for Nx applications because base config is not included by storybook if it's not in the root cwd
        // Qwik-city plugin may be used in apps, but it has mdx stuff that conflicts with Storybook mdx
        // we'll try to only remove the transform code (where the mdx stuff is), and keep everything else.
        return { ...plugin, transform: () => null } as PluginOption;

      default:
        return plugin;
    }
  });
  return updated;
}
