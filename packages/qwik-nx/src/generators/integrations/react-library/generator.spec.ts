import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';

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
});
