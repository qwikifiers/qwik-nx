import { ensurePackage, readJson, Tree } from '@nrwl/devkit';
import { PackageJson } from 'nx/src/utils/package-json';

function readNxVersion(packageJson: PackageJson) {
  return (
    packageJson?.devDependencies?.['nx'] ??
    packageJson?.dependencies?.['nx'] ??
    packageJson?.devDependencies?.['@nrwl/workspace'] ??
    packageJson?.dependencies?.['@nrwl/workspace']
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

export function ensurePeerDependenciesInstalled(tree: Tree): void {
  const packageJsonPath = `node_modules/qwik-nx/package.json`;
  const pkgJson: PackageJson = readJson(tree, packageJsonPath);

  const nxVersion = getInstalledNxVersion(tree);

  for (const [dependency, version] of Object.entries(
    pkgJson.peerDependencies!
  )) {
    if (dependency.startsWith('@nrwl/')) {
      ensurePackage(dependency, nxVersion);
    } else {
      ensurePackage(dependency, version);
    }
  }
}
