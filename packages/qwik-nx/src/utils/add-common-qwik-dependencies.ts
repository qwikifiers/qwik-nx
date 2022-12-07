import {
  addDependenciesToPackageJson,
  GeneratorCallback,
  Tree,
} from '@nrwl/devkit';
import {
  qwikCityVersion,
  qwikVersion,
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
      vite: viteVersion,
      'vite-tsconfig-paths': viteTsconfigPathsVersion,
      // TODO: dependencies below should be setup correctly by Nx's generator, so not needed to provide them here?
      // "@types/eslint": typesEslint,
      // '@types/node': 'latest',
      // "@typescript-eslint/eslint-plugin": tsEslintVersion,
      // "@typescript-eslint/parser": tsEslintVersion,
      // "eslint": eslintVersion,
      // "eslint-plugin-qwik": qwikEslintPluginVersion,
      // "node-fetch": nodeFetchVersion,
      // "prettier": prettierVersion,
      // "typescript": typescriptVersion,
    }
  );
}
