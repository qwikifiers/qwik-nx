import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import componentGenerator from './generator';
import { getFormattedListChanges } from './../../utils/testing-generators';
import libraryGenerator from '../library/generator';
import appGenerator from '../application/generator';

describe('component generator', () => {
  let appTree: Tree;
  const projectName = 'dummy-lib';
  const appProjectName = 'dummy-app';

  beforeEach(async () => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

    await libraryGenerator(appTree, { name: projectName, skipFormat: true });
    await appGenerator(appTree, { name: appProjectName, skipFormat: true });
  });

  it('should throw if directory is outside of the provided lib project', async () => {
    await expect(
      componentGenerator(appTree, {
        name: 'hello',
        project: projectName,
        directory: 'libs/another-lib/src',
      })
    ).rejects.toThrowError(
      'The provided path "libs/another-lib/src" (resolved as "libs/another-lib/src/hello") does not exist under the project root ("libs/dummy-lib"). ' +
        'Please make sure to provide a path that exists under the project root.'
    );
  });
  it('should throw if directory is outside of the provided app project', async () => {
    await expect(
      componentGenerator(appTree, {
        name: 'hello',
        project: appProjectName,
        directory: 'apps/another-app/src',
      })
    ).rejects.toThrowError(
      'The provided path "apps/another-app/src" (resolved as "apps/another-app/src/hello") does not exist under the project root ("apps/dummy-app"). ' +
        'Please make sure to provide a path that exists under the project root.'
    );
  });

  describe('should generate a component file inside a given directory', () => {
    test.each`
      project           | directory                                            | expectedComponentPath
      ${projectName}    | ${undefined}                                         | ${'libs/dummy-lib/src/lib/hello/hello.tsx'}
      ${projectName}    | ${'libs/dummy-lib/src/lib/components/nested-folder'} | ${'libs/dummy-lib/src/lib/components/nested-folder/hello/hello.tsx'}
      ${projectName}    | ${'libs/dummy-lib/secondary/src'}                    | ${'libs/dummy-lib/secondary/src/hello/hello.tsx'}
      ${appProjectName} | ${undefined}                                         | ${'apps/dummy-app/src/components/hello/hello.tsx'}
      ${appProjectName} | ${'apps/dummy-app/src/components/nested-folder'}     | ${'apps/dummy-app/src/components/nested-folder/hello/hello.tsx'}
      ${appProjectName} | ${'apps/dummy-app/secondary/src'}                    | ${'apps/dummy-app/secondary/src/hello/hello.tsx'}
    `(
      'should generate component at "$expectedComponentPath" for project $project when directory is "$directory"',
      async ({ directory, project, expectedComponentPath }) => {
        const initialChangesToOmit = getFormattedListChanges(appTree);
        await componentGenerator(appTree, {
          name: 'hello',
          project,
          directory,
        });

        expect(appTree.read(expectedComponentPath, 'utf-8')).toBeTruthy();
        expect(
          getFormattedListChanges(appTree, initialChangesToOmit)
        ).toMatchSnapshot(JSON.stringify({ directory }));
      }
    );
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
        const initialChangesToOmit = getFormattedListChanges(appTree);
        await componentGenerator(appTree, {
          name: 'hello',
          project: projectName,
          generateStories,
          skipTests,
          exportDefault,
        });
        expect(
          getFormattedListChanges(appTree, initialChangesToOmit)
        ).toMatchSnapshot();
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
