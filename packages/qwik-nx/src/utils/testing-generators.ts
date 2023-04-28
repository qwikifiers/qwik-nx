import { addProjectConfiguration, names, Tree } from '@nx/devkit';

export function createLib(tree: Tree, libName: string): void {
  const { fileName } = names(libName);

  addProjectConfiguration(
    tree,
    fileName,
    {
      tags: [],
      root: `libs/${fileName}`,
      projectType: 'library',
      sourceRoot: `libs/${fileName}/src`,
      targets: {},
    },
    true
  );
}

export function getFormattedListChanges(
  tree: Tree
): { path: string; type: string }[] {
  return [...tree.listChanges()]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((c) => ({ path: c.path, type: c.type }));
}
