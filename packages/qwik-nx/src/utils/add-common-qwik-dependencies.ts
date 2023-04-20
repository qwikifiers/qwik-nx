import {
  addDependenciesToPackageJson,
  GeneratorCallback,
  Tree,
} from '@nrwl/devkit';
import {
  nodeFetchVersion,
  qwikCityVersion,
  qwikEslintPluginVersion,
  qwikVersion,
  undiciVersion,
  vitestVersion,
  viteTsconfigPathsVersion,
  viteVersion,
} from './versions';

export function addCommonQwikDependencies(host: Tree): GeneratorCallback {
  return addDependenciesToPackageJson(
    host,
    {},
    {
      '@builder.io/qwik': qwikVersion,
      '@builder.io/qwik-city': qwikCityVersion,
      'eslint-plugin-qwik': qwikEslintPluginVersion,
      vite: viteVersion,
      vitest: vitestVersion, // TODO: vitest is also installed by "@nrwl/vite", but our version is higher
      'vite-tsconfig-paths': viteTsconfigPathsVersion,
      'node-fetch': nodeFetchVersion,
      undici: undiciVersion,
    }
  );
}
