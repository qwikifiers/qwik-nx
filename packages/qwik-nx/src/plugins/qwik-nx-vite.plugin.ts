import { type QwikVitePlugin } from '@builder.io/qwik/optimizer';
import { type Plugin } from 'vite';
import { join } from 'path';
import { readWorkspaceConfig } from 'nx/src/project-graph/file-utils';
import { workspaceRoot } from '@nrwl/devkit';
import { readFileSync } from 'fs';

export function qwikNxVite() {
  const vitePlugin: Plugin = {
    name: 'vite-plugin-qwik-nx',
    enforce: 'pre',

    async configResolved(config) {
      const qwikPlugin = config.plugins.find(
        (p) => p.name === 'vite-plugin-qwik'
      ) as QwikVitePlugin;
      if (!qwikPlugin) {
        throw new Error('Missing vite-plugin-qwik');
      }

      const workspaceConfig = readWorkspaceConfig({ format: 'nx' });

      let vendorRoots = Object.values(workspaceConfig.projects).map((p) =>
        join(workspaceRoot, p.sourceRoot ?? p.root + '/src')
      );

      vendorRoots = getFilteredVendorRoots(vendorRoots);

      qwikPlugin.api.getOptions().vendorRoots.push(...vendorRoots);
    },
  };

  return vitePlugin;
}

/**
 * Project's source root is specified relatively to the workspace root (e.g. "libs/libname/src").
 * At the same time tsconfig.base.json has path specified as "libs/libname/src/index.ts"
 *
 * Since it is required to only those "vendorRoots" that are exportable (specified in tsconfig.base.json),
 * need to ensure substring of a particular "vendorRoot" is present in the array of tsconfig's paths.
 *
 * Naive approach is to check every vendorRoot against every path, which is O(n^2).
 * Instead, function below does it in O(n) time complexity by splitting each tsconfig path into parts and putting in into Set.
 * Set will contain values like ["libs", "libs/libname", "libs/libname/src"], in other words it will contain all possible values of a vendorRoot.
 */
function getFilteredVendorRoots(vendorRoots: string[]): string[] {
  const baseTsConfig = JSON.parse(
    readFileSync(join(workspaceRoot, 'tsconfig.base.json')).toString()
  );
  const decoratedPaths = Object.values<string[]>(
    baseTsConfig.compilerOptions.paths
  )
    .flat()
    .reduce((acc, path) => {
      const pathChunks = path.split('/').filter(Boolean);
      let pathChunk = '';
      do {
        pathChunk = pathChunk + '/' + pathChunks.shift();
        acc.push(pathChunk);
      } while (pathChunks.length);
      return acc;
    }, [])
    .map((p) => join(workspaceRoot, p));

  const decoratedPathsSet = new Set(decoratedPaths);
  return vendorRoots.filter((p) => decoratedPathsSet.has(p));
}
