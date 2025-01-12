import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';

import appGenerator from '../generators/application/generator';
import update from './add-root-property-to-vite-config';

describe('add-root-property-to-vite-config migration', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    await appGenerator(tree, { directory: 'apps/myapp' });
  });

  it('should add/update the "root" property', async () => {
    const viteConfigPath = `apps/myapp/vite.config.ts`;
    // just to ensure the file at that paths exists before updating it
    expect(tree.exists(viteConfigPath)).toBeTruthy();

    tree.write(viteConfigPath, getViteConfigSample());
    update(tree);
    expect(tree.read(viteConfigPath, 'utf-8')).toMatchSnapshot();
  });
});

const getViteConfigSample = (
  includeRootProp = false
) => `import { qwikVite } from '@builder.io/qwik/optimizer';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { qwikNxVite } from 'qwik-nx/plugins';

export default defineConfig({
  ${includeRootProp ? '\nroot: "apps/myapp"' : ''}
  plugins: [
    qwikNxVite(),
    qwikVite({
      client: {
        outDir: '../../dist/apps/myapp/client',
      },
      ssr: {
        outDir: '../../dist/apps/myapp/server',
      },
    }),
    tsconfigPaths({ root: '../../' }),
  ],
});
`;
