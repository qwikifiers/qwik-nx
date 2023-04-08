import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';

import { storybookConfigurationGenerator } from './generator';
import { StorybookConfigurationGeneratorSchema } from './schema';
import appGenerator from '../application/generator';
import { Linter } from '@nrwl/linter';
import { libraryGenerator } from '../library/generator';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const devkit = require('@nrwl/devkit');
const getInstalledNxVersionModule = require('../../utils/get-installed-nx-version');

describe('storybook-configuration generator', () => {
  let appTree: Tree;
  const projectName = 'test-project';
  const options: StorybookConfigurationGeneratorSchema = { name: projectName };

  jest.spyOn(devkit, 'ensurePackage').mockReturnValue(Promise.resolve());
  jest
    .spyOn(getInstalledNxVersionModule, 'getInstalledNxVersion')
    .mockReturnValue('15.6.0');

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
      executor: '@nrwl/storybook:storybook',
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
      executor: '@nrwl/storybook:build',
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

    expect(
      [...appTree.listChanges()]
        .sort((a, b) => a.path.localeCompare(b.path))
        .map((c) => ({ path: c.path, type: c.type }))
    ).toMatchSnapshot();
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
