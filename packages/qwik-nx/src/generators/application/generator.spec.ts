import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';

import generator from './generator';
import { QwikAppGeneratorSchema } from './schema';

describe('qwik-nx generator', () => {
  let appTree: Tree;
  const options: QwikAppGeneratorSchema = {
    name: 'test',
    style: 'css',
    linter: 'none',
    skipFormat: false,
    unitTestRunner: 'none',
    strict: false
  };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
  });
});
