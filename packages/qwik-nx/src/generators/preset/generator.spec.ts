import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';

import generator from './generator';
import { QwikWorkspacePresetGeneratorSchema } from './schema';
import { Linter } from '@nrwl/linter';

describe('preset generator', () => {
  let appTree: Tree;
  const options: QwikWorkspacePresetGeneratorSchema = {
    name: 'test',
    qwikAppName: 'test',
    qwikAppStyle: 'css',
    style: 'css',
    linter: Linter.None,
    skipFormat: false,
    e2eTestRunner: 'playwright',
    unitTestRunner: 'none',
    strict: false,
  };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
  });
});
