import { readJson, Tree } from '@nrwl/devkit';

export function getInstalledNxVersion(tree: Tree): string | null {
  const pkgJson = readJson(tree, 'package.json');
  if (pkgJson.devDependencies && pkgJson.devDependencies['@nrwl/workspace']) {
    return pkgJson.devDependencies['@nrwl/workspace'];
  }
  return;
}
