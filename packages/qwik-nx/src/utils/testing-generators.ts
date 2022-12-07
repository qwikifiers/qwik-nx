import { addProjectConfiguration, names, Tree } from '@nrwl/devkit';

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
