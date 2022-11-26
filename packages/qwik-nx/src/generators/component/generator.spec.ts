import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree } from '@nrwl/devkit';
import componentGenerator from './generator';

describe('component generator', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should generate a component file inside a given directory', async () => {
    await componentGenerator(appTree, {
      name: 'hello',
      directory: 'components'
    });

    expect(appTree.exists('libs/components/hello/hello.tsx')).toBeTruthy();

  });
});
