import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree } from '@nrwl/devkit';
import componentGenerator from './generator';
import {
  createLib,
  getFormattedListChanges,
} from './../../utils/testing-generators';

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

    expect(getFormattedListChanges(appTree)).toMatchSnapshot();
  });

  describe('generated contents should match the snapshot', () => {
    // [ '000', '001', '010', '011', '100', '101', '110', '111' ]
    test.each`
      exportDefault | generateStories | skipTests
      ${false}      | ${false}        | ${false}
      ${false}      | ${false}        | ${true}
      ${false}      | ${true}         | ${false}
      ${false}      | ${true}         | ${true}
      ${true}       | ${false}        | ${false}
      ${true}       | ${false}        | ${true}
      ${true}       | ${true}         | ${false}
      ${true}       | ${true}         | ${true}
    `(
      'should match the snapshot when exportDefault is "$exportDefault", generateStories is "$generateStories" and skipTests is "$skipTests" ',
      async ({ exportDefault, generateStories, skipTests }) => {
        await componentGenerator(appTree, {
          name: 'hello',
          project: projectName,
          generateStories,
          skipTests,
          exportDefault,
        });
        expect(getFormattedListChanges(appTree)).toMatchSnapshot();
        expect(
          appTree
            .read(`libs/${projectName}/src/lib/hello/hello.tsx`)
            ?.toString()
        ).toMatchSnapshot('hello.tsx');
        expect(
          appTree
            .read(`libs/${projectName}/src/lib/hello/hello.spec.tsx`)
            ?.toString()
        ).toMatchSnapshot('hello.spec.tsx');
        expect(
          appTree
            .read(`libs/${projectName}/src/lib/hello/hello.stories.tsx`)
            ?.toString()
        ).toMatchSnapshot('hello.stories.tsx');
        expect(
          appTree
            .read(`libs/${projectName}/src/lib/hello/hello.doc.mdx`)
            ?.toString()
        ).toMatchSnapshot('hello.doc.mdx');
      }
    );
  });
});
