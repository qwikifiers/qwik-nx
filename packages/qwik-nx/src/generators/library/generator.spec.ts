import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, joinPathFragments, readProjectConfiguration } from '@nx/devkit';

import generator from './generator';
import { LibraryGeneratorSchema } from './schema';
import { getFormattedListChanges } from '../../utils/testing-generators';

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
    expect(getFormattedListChanges(appTree)).toMatchSnapshot();
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
    expect(getFormattedListChanges(appTree)).toMatchSnapshot();
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
    expect(getFormattedListChanges(appTree)).toMatchSnapshot();
  });

  describe('should be able to resolve directory path based on the workspace layout', () => {
    test.each`
      directory             | expectedProjectName | projectRoot
      ${'/shared'}          | ${'shared-mylib'}   | ${'libs/shared/mylib'}
      ${'libs'}             | ${'mylib'}          | ${'libs/mylib'}
      ${'/libs/shared'}     | ${'shared-mylib'}   | ${'libs/shared/mylib'}
      ${'libs/shared'}      | ${'shared-mylib'}   | ${'libs/shared/mylib'}
      ${'/packages'}        | ${'mylib'}          | ${'packages/mylib'}
      ${'/packages/shared'} | ${'shared-mylib'}   | ${'packages/shared/mylib'}
    `(
      'when directory is "$directory" should generate "$expectedProjectName" with project\'s root at "$projectRoot"',
      async ({ directory, expectedProjectName, projectRoot }) => {
        await generator(appTree, { ...options, directory });
        const config = readProjectConfiguration(appTree, expectedProjectName);

        expect(config.root).toBe(projectRoot);
        expect(config).toMatchSnapshot(
          JSON.stringify(directory, expectedProjectName)
        );
        expect(
          appTree.exists(joinPathFragments(projectRoot, 'vite.config.ts'))
        ).toBeTruthy();
      }
    );
  });
});
