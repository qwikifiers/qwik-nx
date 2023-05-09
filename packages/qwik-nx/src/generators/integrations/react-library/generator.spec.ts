import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, joinPathFragments, readProjectConfiguration } from '@nx/devkit';

import { reactLibraryGenerator } from './generator';
import { ReactLibraryGeneratorSchema } from './schema';
import { getFormattedListChanges } from '../../../utils/testing-generators';
import appGenerator from '../../application/generator';

describe('integrations/react-library generator', () => {
  let appTree: Tree;
  const options: ReactLibraryGeneratorSchema = { name: 'mylib' };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should run successfully', async () => {
    await reactLibraryGenerator(appTree, options);
    const config = readProjectConfiguration(appTree, 'mylib');

    expect(config.targets!['build']).not.toBeDefined();
    expect(config.targets!['test']).toBeDefined();
    expect(config.targets!['lint']).toBeDefined();

    expect(config).toMatchSnapshot();
    expect(
      appTree.read('libs/mylib/vite.config.ts', 'utf-8')
    ).toMatchSnapshot();
    expect(getFormattedListChanges(appTree)).toMatchSnapshot();
    const expectedDeps = [
      '@builder.io/qwik-react',
      '@emotion/react',
      '@emotion/styled',
      '@types/react',
      '@types/react-dom',
      'react',
      'react-dom',
      '@mui/material',
      '@mui/x-data-grid',
    ];
    const deps = Object.keys(
      JSON.parse(appTree.read('package.json', 'utf-8')!).devDependencies
    );
    expect(expectedDeps.every((d) => deps.includes(d))).toBeTruthy();
  });

  it('should generate demo component without MUI dependencies', async () => {
    await reactLibraryGenerator(appTree, {
      ...options,
      installMUIExample: false,
    });
    const config = readProjectConfiguration(appTree, 'mylib');

    expect(config.targets!['build']).not.toBeDefined();
    expect(config.targets!['test']).toBeDefined();
    expect(config.targets!['lint']).toBeDefined();

    expect(config).toMatchSnapshot();
    expect(
      appTree.read('libs/mylib/vite.config.ts', 'utf-8')
    ).toMatchSnapshot();
    expect(getFormattedListChanges(appTree)).toMatchSnapshot();
    const expectedDeps = [
      '@builder.io/qwik-react',
      '@emotion/react',
      '@emotion/styled',
      '@types/react',
      '@types/react-dom',
      'react',
      'react-dom',
    ];
    const muiDeps = ['@mui/material', '@mui/x-data-grid'];
    const deps = Object.keys(
      JSON.parse(appTree.read('package.json', 'utf-8')!).devDependencies
    );
    expect(expectedDeps.every((d) => deps.includes(d))).toBeTruthy();
    expect(muiDeps.some((d) => deps.includes(d))).toBeFalsy();
  });

  it('should update app config if provided', async () => {
    await appGenerator(appTree, { name: 'myapp1' });
    await appGenerator(appTree, { name: 'myapp2' });
    await reactLibraryGenerator(appTree, {
      ...options,
      targetApps: 'myapp1, myapp2',
    });

    expect(appTree.read('apps/myapp1/vite.config.ts', 'utf-8')).toMatchSnapshot(
      'myapp1'
    );
    expect(appTree.read('apps/myapp2/vite.config.ts', 'utf-8')).toMatchSnapshot(
      'myapp2'
    );
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
        await reactLibraryGenerator(appTree, { ...options, directory });
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
