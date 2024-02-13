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
  const { satisfies } = ensurePackage<typeof import('semver')>('semver', '*');
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

  const unsupportedPackageVersions = new Map<string, string>([
    // https://github.com/vitejs/vite/issues/15870
    ['vite', '<5.1.0'],
  ]);
  let hasChanges = false;
  for (const [dep, versionRange] of unsupportedPackageVersions.entries()) {
    const existingVersion =
      currentPackageJson.dependencies[dep] ??
      currentPackageJson.devDependencies[dep];
    if (existingVersion && !satisfies(existingVersion, versionRange)) {
      hasChanges = true;
      // remove the dependency if it is set with incompatible version
      // we'll install our version instead
      delete currentPackageJson.dependencies[dep];
      delete currentPackageJson.devDependencies[dep];
    }
  }
  if (hasChanges) {
    writeJson(tree, 'package.json', currentPackageJson);
  }

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
