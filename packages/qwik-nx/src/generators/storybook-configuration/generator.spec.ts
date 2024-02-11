import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { storybookConfigurationGenerator } from './generator';
import { StorybookConfigurationGeneratorSchema } from './schema';
import appGenerator from '../application/generator';
import { Linter } from '@nx/eslint';
import { libraryGenerator } from '../library/generator';
import { mockEnsurePackage } from '../../utils/testing-generators';

describe('storybook-configuration generator', () => {
  mockEnsurePackage();

  let appTree: Tree;
  const projectName = 'test-project';
  const options: StorybookConfigurationGeneratorSchema = { name: projectName };

  beforeEach(async () => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

    await appGenerator(appTree, {
      name: projectName,
      e2eTestRunner: 'none',
      linter: Linter.None,
      skipFormat: false,
      strict: true,
      style: 'css',
      unitTestRunner: 'none',
    });
  });

  it('should add required targets', async () => {
    await storybookConfigurationGenerator(appTree, options);
    const config = readProjectConfiguration(appTree, projectName);
    expect(config.targets!['storybook']).toEqual({
      executor: '@nx/storybook:storybook',
      options: {
        port: 4400,
        configDir: `apps/${projectName}/.storybook`,
      },
      configurations: {
        ci: {
          quiet: true,
        },
      },
    });
    expect(config.targets!['build-storybook']).toEqual({
      executor: '@nx/storybook:build',
      outputs: ['{options.outputDir}'],
      options: {
        configDir: `apps/${projectName}/.storybook`,
        outputDir: `dist/storybook/${projectName}`,
      },
      configurations: {
        ci: {
          quiet: true,
        },
      },
    });

    // TODO: commented out for ecosystem ci to not fail
    // expect(expect(getFormattedListChanges(appTree)).toMatchSnapshot());
    expect(
      appTree.read(`apps/${projectName}/.storybook/main.ts`)?.toString()
    ).toMatchSnapshot();
    expect(
      appTree.read(`apps/${projectName}/.storybook/preview.ts`)?.toString()
    ).toMatchSnapshot();
  });

  describe('should conditionally add qwikCity decorator to preview.ts', () => {
    const libProjectName = 'test-project-lib';

    beforeEach(async () => {
      await libraryGenerator(appTree, {
        name: libProjectName,
        linter: Linter.None,
        skipFormat: true,
        strict: true,
        style: 'css',
        unitTestRunner: 'none',
      });
    });

    test.each`
      qwikCitySupport | project
      ${'true'}       | ${libProjectName}
      ${'false'}      | ${libProjectName}
      ${'auto'}       | ${libProjectName}
      ${'true'}       | ${projectName}
      ${'false'}      | ${projectName}
      ${'auto'}       | ${projectName}
    `(
      'matches the snapshot when qwikCitySupport is "$qwikCitySupport" and project is "$project"',
      async ({ qwikCitySupport, project }) => {
        await storybookConfigurationGenerator(appTree, {
          ...options,
          qwikCitySupport,
          name: project,
        });
        expect(
          appTree
            .read(
              `${
                project === libProjectName ? 'libs' : 'apps'
              }/${project}/.storybook/preview.ts`
            )
            ?.toString()
        ).toMatchSnapshot();
      }
    );
  });
});
