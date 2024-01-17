import { type Plugin } from 'vite';
import {
  QwikNxVitePluginOptions,
  QwikVitePluginStub,
} from './models/qwik-nx-vite';
import { getVendorRoots } from './utils/get-vendor-roots';
import { output } from '@nx/devkit';

/**
 * `qwikNxVite` plugin serves as an integration step between Qwik and Nx.
 * At this point its main purpose is to provide Nx libraries as vendor roots for the Qwik.
 * This is required in order for the optimizer to be able to work with entities imported from those libs.
 *
 * By default `qwikNxVite` plugin will provide Qwik with paths of Nx projects,
 * that are recognized as dependencies of the current one and are specified in the tsconfig.base.json.
 * this behavior is customizable: you can exclude additional projects by providing `options.excludeProjects.keepUnrelatedProjects`,
 * or completely control what's included by using `options.includeProjects`
 */
export function qwikNxVite(options?: QwikNxVitePluginOptions): Plugin {
  const vitePlugin: Plugin = {
    name: 'vite-plugin-qwik-nx',
    enforce: 'pre',

    async configResolved(config) {
      const qwikPlugins = config.plugins.filter(
        (p) => p.name === 'vite-plugin-qwik'
      ) as QwikVitePluginStub[];
      if (!qwikPlugins.length) {
        throw new Error('Missing vite-plugin-qwik');
      }

      if (qwikPlugins.length > 1) {
        output.warn({
          title:
            'Multiple instances of "vite-plugin-qwik" found. Check your vite.config!',
        });
      }

      for (const qwikPlugin of qwikPlugins) {
        // it's not expected to have the plugin duplicated, but handling it as an edge case
        const pluginOptions = qwikPlugin.api.getOptions();

        const vendorRoots = await getVendorRoots(options, pluginOptions);

        pluginOptions.vendorRoots.push(...vendorRoots);
      }
    },
  };

  return vitePlugin;
}
