import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import update from './add-verbose-skip-type-check-option-for-the-build-executor';
import appGenerator from '../../generators/application/generator';

describe('add-verbose-skip-type-check-option-for-the-build-executor migration', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    await appGenerator(tree, { name: 'myapp' });
  });

  it('should run successfully', async () => {
    await update(tree);
    expect(readProjectConfiguration(tree, 'myapp').targets?.['build']).toEqual({
      executor: 'qwik-nx:build',
      options: {
        runSequence: ['myapp:build.client', 'myapp:build.ssr'],
        outputPath: 'dist/apps/myapp',
        skipTypeCheck: false,
      },
      configurations: {
        preview: {},
      },
    });
  });
});
