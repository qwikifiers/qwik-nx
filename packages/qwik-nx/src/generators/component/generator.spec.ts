import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree } from '@nrwl/devkit';
import componentGenerator from './generator';
import { createLib } from './../../utils/testing-generators';

describe('component generator', () => {
  let appTree: Tree;
  const projectName = 'dummy-lib';

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    createLib(appTree, projectName);
  });

  it('should generate a component file inside a given directory', async () => {
    await componentGenerator(appTree, {
      name: 'hello',
      project: projectName,
    });

    expect(
      appTree.exists(`libs/${projectName}/src/lib/hello/hello.tsx`)
    ).toBeTruthy();
  });
});
