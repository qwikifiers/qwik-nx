import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, joinPathFragments, readProjectConfiguration } from '@nx/devkit';

import generator from './generator';
import { QwikAppGeneratorSchema } from './schema';
import { Linter } from '@nx/linter';
import { getFormattedListChanges } from './../../utils/testing-generators';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const devkit = require('@nx/devkit');
const getInstalledNxVersionModule = require('../../utils/get-installed-nx-version');

describe('qwik-nx generator', () => {
  let appTree: Tree;
  const defaultOptions: QwikAppGeneratorSchema = {
    name: 'myapp',
    style: 'css',
    linter: Linter.None,
    skipFormat: false,
    unitTestRunner: 'none',
    strict: false,
    e2eTestRunner: 'none',
  };

  jest.spyOn(devkit, 'ensurePackage').mockReturnValue(Promise.resolve());
  jest
    .spyOn(getInstalledNxVersionModule, 'getInstalledNxVersion')
    .mockReturnValue('15.6.0');

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should run successfully', async () => {
    await generator(appTree, defaultOptions);
    const config = readProjectConfiguration(appTree, 'myapp');
    expect(config).toBeDefined();
    expect(
      appTree.read('apps/myapp/vite.config.ts', 'utf-8')
    ).toMatchSnapshot();
    expect(appTree.read('apps/myapp/project.json', 'utf-8')).toMatchSnapshot();
    expect(getFormattedListChanges(appTree)).toMatchSnapshot();
  });

  describe('e2e project', () => {
    it('--e2eTestRunner none', async () => {
      await generator(appTree, {
        ...defaultOptions,
        e2eTestRunner: 'none',
      });
      expect(() => readProjectConfiguration(appTree, 'myapp-e2e')).toThrowError(
        `Cannot find configuration for 'myapp-e2e'`
      );
    });

    it('--e2eTestRunner playwright', async () => {
      await generator(appTree, {
        ...defaultOptions,
        e2eTestRunner: 'playwright',
      });
      const config = readProjectConfiguration(appTree, 'myapp-e2e');
      expect(config).toBeDefined();
      expect(config.targets?.e2e.executor).toEqual('@nxkit/playwright:test');
      expect(
        appTree.exists('apps/myapp-e2e/playwright.config.ts')
      ).toBeTruthy();
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
  });

  describe('should be able to resolve directory path based on the workspace layout', () => {
    test.each`
      directory               | expectedProjectName | projectRoot
      ${'/frontend'}          | ${'frontend-myapp'} | ${'apps/frontend/myapp'}
      ${'apps'}               | ${'myapp'}          | ${'apps/myapp'}
      ${'/apps/frontend'}     | ${'frontend-myapp'} | ${'apps/frontend/myapp'}
      ${'apps/frontend'}      | ${'frontend-myapp'} | ${'apps/frontend/myapp'}
      ${'/packages'}          | ${'myapp'}          | ${'packages/myapp'}
      ${'/packages/frontend'} | ${'frontend-myapp'} | ${'packages/frontend/myapp'}
    `(
      'when directory is "$directory" should generate "$expectedProjectName" with project\'s root at "$projectRoot"',
      async ({ directory, expectedProjectName, projectRoot }) => {
        await generator(appTree, { ...defaultOptions, directory });
        const config = readProjectConfiguration(appTree, expectedProjectName);

        expect(config.root).toBe(projectRoot);
        expect(config).toMatchSnapshot(
          JSON.stringify(directory, expectedProjectName)
        );
        expect(
          appTree.exists(joinPathFragments(projectRoot, 'vite.config.ts'))
        ).toBeTruthy();
      }
    );
  });
});
