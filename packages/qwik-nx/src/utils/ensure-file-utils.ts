import { readJson, readProjectConfiguration, Tree } from '@nrwl/devkit';
import { join } from 'path';

/** Creates root.tsx if it is not found */
export function ensureRootTsxExists(tree: Tree, projectName: string) {
  const projectConfig = readProjectConfiguration(tree, projectName);

  const sourceRoot =
    projectConfig.sourceRoot ?? join(projectConfig.root, 'src');
  const rootTsxPath = join(sourceRoot, 'root.tsx');

  if (!tree.exists(rootTsxPath)) {
    tree.write(rootTsxPath, rootTsxContent);
  }
}

const rootTsxContent = `// This is explicitly empty, but serves as a compilation entry-point for the client mode.
export default {};`;

export function ensureMdxTypeInTsConfig(tree: Tree, projectName: string) {
  const projectConfig = readProjectConfiguration(tree, projectName);

  const tsConfigPath = join(projectConfig.root, 'tsconfig.json');
  if (tree.exists(tsConfigPath)) {
    const tsConfig = readJson(tree, tsConfigPath);

    if (!((tsConfig.compilerOptions ??= {}).types ??= []).includes('mdx')) {
      tsConfig.compilerOptions.types.push('mdx');
      tree.write(tsConfigPath, JSON.stringify(tsConfig));
    }
  }
}
