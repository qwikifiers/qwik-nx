import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';

import update from './migrate-cloudflare-integration';
import { appGenerator } from '../../generators/application/generator';

describe('migrate-cloudflare-integration migration', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    await appGenerator(tree, { name: 'myapp' });
    tree.write('apps/myapp/functions/[[path]].ts', 'export default {}');
    tree.write(
      'apps/myapp/adapters/cloudflare-pages/vite.config.ts',
      'export default {}'
    );
    tree.write(
      'apps/myapp/src/entry.cloudflare-pages.tsx',
      `import { createQwikCity } from '@builder.io/qwik-city/middleware/cloudflare-pages';
    import qwikCityPlan from '@qwik-city-plan';
    import render from './entry.ssr';
    
    const onRequest = createQwikCity({ render, qwikCityPlan });
    
    export { onRequest };`
    );
  });

  it('should run successfully', async () => {
    await update(tree);
    expect(tree.exists('apps/myapp/functions/[[path]].ts')).toBe(false);
    expect(
      tree.read('apps/myapp/src/entry.cloudflare-pages.tsx', 'utf-8')
    ).toMatchSnapshot('entry.cloudflare-pages.tsx');
  });
});
