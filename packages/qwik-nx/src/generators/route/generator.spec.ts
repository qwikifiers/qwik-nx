import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import { routeGenerator } from './generator';
import { RouteGeneratorSchema } from './schema';
import appGenerator from '../application/generator';

describe('route generator', () => {
  async function setup() {
    const appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    await appGenerator(appTree, { name: 'testApp' });

    const routeOptions: RouteGeneratorSchema = {
      name: 'fake-route',
      project: 'test-app',
    };

    return {
      appTree,
      routeOptions,
    };
  }

  it('should generate the route index.tsx in the right location', async () => {
    const { appTree, routeOptions } = await setup();
    await routeGenerator(appTree, routeOptions);
    expect(
      appTree.exists('apps/test-app/src/routes/fake-route/index.tsx')
    ).toBeTruthy();
  });

  it('should generate layout.tsx if selected', async () => {
    const { appTree, routeOptions } = await setup();
    routeOptions.addLayout = true;
    await routeGenerator(appTree, routeOptions);
    expect(
      appTree.exists('apps/test-app/src/routes/fake-route/layout.tsx')
    ).toBeTruthy();
  });
});
