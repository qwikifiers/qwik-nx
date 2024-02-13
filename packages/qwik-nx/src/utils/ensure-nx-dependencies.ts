import { NX_VERSION, ensurePackage } from '@nx/devkit';

export function ensureNxDependencies() {
  for (const pkg of ['@nx/devkit', '@nx/js', '@nx/vite', '@nx/eslint']) {
    ensurePackage(pkg, NX_VERSION);
  }
}
