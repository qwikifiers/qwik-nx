import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readJson } from '@nx/devkit';

import generator from './init';
import { InitGeneratorSchema } from './schema';

describe('init generator', () => {
  let appTree: Tree;
  const options: InitGeneratorSchema = {};

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const { devDependencies } = readJson(appTree, 'package.json');
    expect(devDependencies['@builder.io/qwik']).toBeDefined();
    expect(devDependencies['@builder.io/qwik-city']).toBeDefined();
    expect(devDependencies['@types/node']).toBeDefined();
    expect(devDependencies['eslint-plugin-qwik']).toBeDefined();
    expect(devDependencies['node-fetch']).toBeDefined();
    expect(devDependencies['undici']).toBeDefined();
    expect(devDependencies['vite']).toBeDefined();
    expect(devDependencies['vitest']).toBeDefined();
    expect(devDependencies['vite-tsconfig-paths']).toBeDefined();
  });
});
