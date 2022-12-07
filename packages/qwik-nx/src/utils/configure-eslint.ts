import {
  addDependenciesToPackageJson,
  GeneratorCallback,
  joinPathFragments,
  readProjectConfiguration,
  Tree,
} from '@nrwl/devkit';
import { lintProjectGenerator, Linter } from '@nrwl/linter';
import { qwikEslintPluginVersion } from './versions';

export function configureEslint(
  tree: Tree,
  project: string,
  skipLibsEslintConfig = false
): GeneratorCallback {
  const cfg = readProjectConfiguration(tree, project);

  const existingLibEslintConfigPath = joinPathFragments(
    cfg.root,
    '.eslintrc.json'
  );
  const existingLibEslintConfig = tree.read(existingLibEslintConfigPath);

  lintProjectGenerator(tree, {
    project: project,
    linter: Linter.EsLint,
    skipFormat: true,
    eslintFilePatterns: [`${cfg.root}/**/*.{ts,tsx,js,jsx}`],
  });

  if (existingLibEslintConfig && skipLibsEslintConfig) {
    tree.write(existingLibEslintConfigPath, existingLibEslintConfig);
  }

  const viteConfigFileName = 'vite.config.ts';
  const eslintIgnorePath = './.eslintignore';
  const eslintIgnore = tree.read(eslintIgnorePath)?.toString() ?? '';
  if (!eslintIgnore.includes(viteConfigFileName)) {
    tree.write(
      eslintIgnorePath,
      (eslintIgnore + `\n${viteConfigFileName}`).trim()
    );
  }
  return addDependenciesToPackageJson(
    tree,
    {},
    {
      'eslint-plugin-qwik': qwikEslintPluginVersion,
    }
  );
}
