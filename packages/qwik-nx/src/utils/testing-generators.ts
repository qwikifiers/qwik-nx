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
