import {
  addDependenciesToPackageJson,
  GeneratorCallback,
  joinPathFragments,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';
import { lintProjectGenerator, Linter } from '@nx/eslint';
import { qwikEslintPluginVersion } from './versions';

export async function configureEslint(
  tree: Tree,
  project: string,
  skipLibsEslintConfig = false
): Promise<GeneratorCallback> {
  const cfg = readProjectConfiguration(tree, project);

  const existingLibEslintConfigPath = joinPathFragments(
    cfg.root,
    '.eslintrc.json'
  );

  let existingLibEslintConfig: Buffer | null | undefined;

  if (tree.exists(existingLibEslintConfigPath)) {
    existingLibEslintConfig = tree.read(existingLibEslintConfigPath);
  }

  await lintProjectGenerator(tree, {
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
  let eslintIgnore = '';
  if (tree.exists(eslintIgnorePath)) {
    eslintIgnore = tree.read(eslintIgnorePath)?.toString() ?? '';
  }
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
