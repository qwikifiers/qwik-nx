import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';

import generator from './generator';
import { LibraryGeneratorSchema } from './schema';

describe('library generator', () => {
  let appTree: Tree;
  const options: LibraryGeneratorSchema = { name: 'mylib' };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'mylib');

    expect(config.targets!['build']).not.toBeDefined();
    expect(config.targets!['test']).toBeDefined();
    expect(config.targets!['lint']).toBeDefined();

    expect(config).toMatchSnapshot();
    expect(
      appTree.read('libs/mylib/vite.config.ts', 'utf-8')
    ).toMatchSnapshot();
    expect(
      appTree.listChanges().map((c) => ({ path: c.path, type: c.type }))
    ).toMatchSnapshot();
  });

  it('should generate build configs for buildable libraries', async () => {
    await generator(appTree, { ...options, buildable: true });
    const config = readProjectConfiguration(appTree, 'mylib');

    expect(config.targets!['build']).toBeDefined();
    expect(config.targets!['test']).toBeDefined();
    expect(config.targets!['lint']).toBeDefined();

    expect(config).toMatchSnapshot();
    expect(
      appTree.read('libs/mylib/vite.config.ts', 'utf-8')
    ).toMatchSnapshot();
    expect(
      appTree.listChanges().map((c) => ({ path: c.path, type: c.type }))
    ).toMatchSnapshot();
  });

  it('should not generate build and test configs for non-buildable libraries w/o unit tests', async () => {
    await generator(appTree, { ...options, unitTestRunner: 'none' });
    const config = readProjectConfiguration(appTree, 'mylib');

    expect(config.targets!['build']).not.toBeDefined();
    expect(config.targets!['test']).not.toBeDefined();
    expect(config.targets!['lint']).toBeDefined();

    expect(appTree.exists('libs/mylib/vite.config.ts')).toBeFalsy();
    expect(appTree.exists('libs/mylib/tsconfig.spec.json')).toBeFalsy();

    expect(config).toMatchSnapshot();
    expect(
      appTree.listChanges().map((c) => ({ path: c.path, type: c.type }))
    ).toMatchSnapshot();
  });
});
