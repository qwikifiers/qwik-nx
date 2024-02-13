/// <reference types="jest" />
import { Tree } from '@nx/devkit';

interface FormattedChange {
  path: string;
  type: string;
}

export function getFormattedListChanges(
  tree: Tree,
  previous?: FormattedChange[]
): FormattedChange[] {
  let formatted = [...tree.listChanges()]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((c) => ({ path: c.path, type: c.type }));

  if (previous) {
    formatted = formatted.filter(
      (f) => !previous.some((p) => p.path === f.path && p.type === f.type)
    );
  }
  return formatted;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const devkit = require('@nx/devkit');
export function mockEnsurePackage() {
  jest.spyOn(devkit, 'ensurePackage').mockImplementation((...args: any[]) => {
    try {
      return require(args[0]);
    } catch {
      return null;
    }
  });
}
