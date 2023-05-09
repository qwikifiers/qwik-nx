import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';
import { appGenerator } from './../application/generator';

import generator from './generator';
import { E2eProjectGeneratorSchema } from './schema';
import { getFormattedListChanges } from '../../utils/testing-generators';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const devkit = require('@nx/devkit');
const getInstalledNxVersionModule = require('../../utils/get-installed-nx-version');

describe('e2e project', () => {
  let appTree: Tree;
  const defaultOptions: Omit<E2eProjectGeneratorSchema, 'e2eTestRunner'> = {
    project: 'myapp',
    skipFormat: true,
  };

  jest.spyOn(devkit, 'ensurePackage').mockReturnValue(Promise.resolve());
  jest
    .spyOn(getInstalledNxVersionModule, 'getInstalledNxVersion')
    .mockReturnValue('15.6.0');

  beforeEach(async () => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    await appGenerator(appTree, {
      name: 'myapp',
      e2eTestRunner: 'none',
    });
  });

  it('--e2eTestRunner playwright', async () => {
    await generator(appTree, {
      ...defaultOptions,
      e2eTestRunner: 'playwright',
    });
    const config = readProjectConfiguration(appTree, 'myapp-e2e');
    expect(config).toBeDefined();
    expect(config.targets?.e2e.executor).toEqual('@nxkit/playwright:test');
    expect(appTree.exists('apps/myapp-e2e/playwright.config.ts')).toBeTruthy();
  });

  it('--e2eTestRunner cypress', async () => {
    await generator(appTree, {
      ...defaultOptions,
      e2eTestRunner: 'cypress',
    });
    const config = readProjectConfiguration(appTree, 'myapp-e2e');
    expect(config).toBeDefined();
    expect(config.targets?.e2e.executor).toEqual('@nx/cypress:cypress');
    expect(appTree.exists('apps/myapp-e2e/cypress.config.ts')).toBeTruthy();
  });

  describe('should be able to resolve directory path based on the workspace layout', () => {
    // TODO: playwright will generate incorrect project names, e.g. for "directory: '/frontend'" it ends up with "-frontend-myapp-e2e"
    test.each`
      directory               | expectedProjectName     | projectRoot                      | framework
      ${'/frontend'}          | ${'frontend-myapp-e2e'} | ${'apps/frontend/myapp-e2e'}     | ${'cypress'}
      ${'apps'}               | ${'myapp-e2e'}          | ${'apps/myapp-e2e'}              | ${'cypress'}
      ${'/apps/frontend'}     | ${'frontend-myapp-e2e'} | ${'apps/frontend/myapp-e2e'}     | ${'cypress'}
      ${'apps/frontend'}      | ${'frontend-myapp-e2e'} | ${'apps/frontend/myapp-e2e'}     | ${'cypress'}
      ${'/packages'}          | ${'myapp-e2e'}          | ${'packages/myapp-e2e'}          | ${'cypress'}
      ${'/packages/frontend'} | ${'frontend-myapp-e2e'} | ${'packages/frontend/myapp-e2e'} | ${'cypress'}
    `(
      'when directory is "$directory" and framework is "$framework" should generate "$expectedProjectName" with project\'s root at "$projectRoot"',
      async ({ directory, framework, expectedProjectName, projectRoot }) => {
        await generator(appTree, {
          ...defaultOptions,
          e2eTestRunner: framework,
          directory,
        });

        const config = readProjectConfiguration(appTree, expectedProjectName);

        expect(config.root).toBe(projectRoot);
        expect(config).toMatchSnapshot(
          JSON.stringify(directory, expectedProjectName)
        );
        expect(getFormattedListChanges(appTree)).toMatchSnapshot(
          JSON.stringify(directory, expectedProjectName)
        );
      }
    );
  });
});
