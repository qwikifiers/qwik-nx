import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';

import generator from './generator';
import { QwikWorkspacePresetGeneratorSchema } from './schema';

describe('preset generator', () => {
  let appTree: Tree;
  const options: QwikWorkspacePresetGeneratorSchema = {
    name: 'test',
    qwikAppName: 'test',
    qwikAppStyle: 'css',
    style: 'css',
    linter: 'none',
    skipFormat: false,
    unitTestRunner: 'none',
    strict: false,
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
