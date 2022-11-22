import {
  addDependenciesToPackageJson,
  Tree,
} from '@nrwl/devkit';
import { eslintVersion, nodeFetchVersion, prettierVersion, qwikCityVersion, qwikEslintPluginVersion, qwikVersion, tsEslintVersion, typescriptVersion, typesEslint, viteTsconfigPathsVersion, viteVersion } from '../../utils/versions';
import { InitGeneratorSchema } from './schema';



function updateDependencies(host: Tree) {
  return addDependenciesToPackageJson(
    host,
    {},
    {
      "@builder.io/qwik": qwikVersion,
      "@builder.io/qwik-city": qwikCityVersion,
      "@types/eslint": typesEslint,
      "@types/node": "latest",
      "@typescript-eslint/eslint-plugin": tsEslintVersion,
      "@typescript-eslint/parser": tsEslintVersion,
      "eslint": eslintVersion,
      "eslint-plugin-qwik": qwikEslintPluginVersion,
      "node-fetch": nodeFetchVersion,
      "prettier": prettierVersion,
      "typescript": typescriptVersion,
      "vite": viteVersion,
      "vite-tsconfig-paths": viteTsconfigPathsVersion
    }
  );
}


export default async function qwikInitGenerator(tree: Tree, options: InitGeneratorSchema) {

  const installTask = updateDependencies(tree);
  await installTask();
}
