import {
  addDependenciesToPackageJson,
  ensurePackage,
  GeneratorCallback,
  readJson,
  Tree,
  writeJson,
} from '@nx/devkit';
import {
  nodeFetchVersion,
  qwikCityVersion,
  qwikEslintPluginVersion,
  qwikVersion,
  typesNodeVersion,
  undiciVersion,
  vitestVersion,
  viteTsconfigPathsVersion,
  viteVersion,
} from './versions';

export function addCommonQwikDependencies(tree: Tree): GeneratorCallback {
  // TODO: refactor to use "addDependenciesToPackageJson" with "keepExistingVersions" once we support nx 17.3 or higher

  const devDependencies = {
    '@builder.io/qwik': qwikVersion,
    '@builder.io/qwik-city': qwikCityVersion,
    '@types/node': typesNodeVersion,
    'eslint-plugin-qwik': qwikEslintPluginVersion,
    vite: viteVersion,
    vitest: vitestVersion,
    'vite-tsconfig-paths': viteTsconfigPathsVersion,
    'node-fetch': nodeFetchVersion,
    undici: undiciVersion,
  };
  const currentPackageJson = readJson(tree, 'package.json');

  return addDependenciesToPackageJson(
    tree,
    {},
    // installing only those deps that are not found
    Object.fromEntries(
      Object.entries(devDependencies).filter(([dep]) => {
        const exists =
          currentPackageJson.dependencies[dep] ??
          currentPackageJson.devDependencies[dep];
        return !exists;
      })
    )
  );
}
