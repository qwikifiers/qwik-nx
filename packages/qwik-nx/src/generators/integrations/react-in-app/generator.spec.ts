import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree } from '@nrwl/devkit';

import { reactInAppGenerator } from './generator';
import { ReactInAppGeneratorSchema } from './schema';
import { getFormattedListChanges } from '../../../utils/testing-generators';
import appGenerator from '../../application/generator';

describe('integrations/react-in-app generator', () => {
  let appTree: Tree;
  const options: ReactInAppGeneratorSchema = { project: 'myapp' };

  beforeEach(async () => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    await appGenerator(appTree, { name: 'myapp' });
  });

  it('should run successfully', async () => {
    await reactInAppGenerator(appTree, options);

    expect(
      appTree.read('apps/myapp/vite.config.ts', 'utf-8')
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
    await reactInAppGenerator(appTree, {
      ...options,
      installMUIExample: false,
    });
    expect(
      appTree.read('apps/myapp/vite.config.ts', 'utf-8')
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
});
