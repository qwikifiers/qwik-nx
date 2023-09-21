import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';

import update from './set-proper-tsconfig-path-for-qwik-vite-plugin';
import appGenerator from '../../generators/application/generator';

describe('set-proper-tsconfig-path-for-qwik-vite-plugin migration', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    await appGenerator(tree, { name: 'myapp' });
  });

  it('should add "tsconfigFileNames" property', async () => {
    const viteConfigPath = `apps/myapp/vite.config.ts`;
    // just to ensure the file at that paths exists before updating it
    expect(tree.exists(viteConfigPath)).toBeTruthy();

    tree.write(viteConfigPath, getViteConfigSample());
    update(tree);
    expect(tree.read(viteConfigPath, 'utf-8')).toMatchSnapshot();
  });
  it('should not modify the "tsconfigFileNames" property if it exists', async () => {
    const viteConfigPath = `apps/myapp/vite.config.ts`;
    tree.write(viteConfigPath, getViteConfigSample(true));

    update(tree);

    expect(tree.read(viteConfigPath, 'utf-8')).toMatchSnapshot();
  });
});

const getViteConfigSample = (
  includeTSConfigFileNamesProp = false
) => `import { qwikVite } from '@builder.io/qwik/optimizer';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { qwikNxVite } from 'qwik-nx/plugins';

export default defineConfig({
  plugins: [
    qwikNxVite(),
    qwikVite({
      client: {
        outDir: '../../dist/apps/myapp/client',
      },
      ssr: {
        outDir: '../../dist/apps/myapp/server',
      },${
        includeTSConfigFileNamesProp
          ? '\ntsconfigFileNames: ["MOCK_VALUE"]'
          : ''
      }
    }),
    tsconfigPaths({ root: '../../' }),
  ],
});
`;
