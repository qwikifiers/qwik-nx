import { type Plugin } from 'vite';

/**
 * @deprecated this plugin is no longer needed and will be removed in the qwik-nx@4
 */
export function qwikNxVite(): Plugin {
  const vitePlugin: Plugin = {
    name: 'vite-plugin-qwik-nx',
    enforce: 'pre',

    configResolved() {
      console.warn(
        'qwikNxVite plugin is deprecated and is no longer used. It will be removed in the next major version of "qwik-nx"'
      );
    },
  };

  return vitePlugin;
}
