import { readJson, Tree } from '@nx/devkit';
import { PackageJson } from 'nx/src/utils/package-json';

function readNxVersion(packageJson: PackageJson) {
  return (
    packageJson?.devDependencies?.['nx'] ??
    packageJson?.dependencies?.['nx'] ??
    packageJson?.devDependencies?.['@nx/workspace'] ??
    packageJson?.dependencies?.['@nx/workspace']
  );
}

export function getInstalledNxVersion(tree: Tree): string {
  const pkgJson: PackageJson = readJson(tree, 'package.json');
  const version = readNxVersion(pkgJson);

  if (version) {
    return version;
  }
  throw new Error('Could not resolve nx version from the package.json');
}
