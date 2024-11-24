import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, joinPathFragments, readProjectConfiguration } from '@nx/devkit';

import generator from './generator';
import { QwikAppGeneratorSchema } from './schema';
import { Linter } from '@nx/eslint';
import {
  getFormattedListChanges,
  mockEnsurePackage,
} from './../../utils/testing-generators';

describe('qwik-nx generator', () => {
  mockEnsurePackage();

  let appTree: Tree;
  const defaultOptions: QwikAppGeneratorSchema = {
    directory: 'apps/myapp',
    style: 'css',
    linter: Linter.None,
    skipFormat: false,
    unitTestRunner: 'none',
    strict: false,
    e2eTestRunner: 'none',
  };

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
      expect(config.targets?.e2e.executor).toEqual('@nx/playwright:playwright');
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
      directory                    | expectedProjectName | projectRoot
      ${'apps/frontend/myapp'}     | ${'myapp'}          | ${'apps/frontend/myapp'}
      ${'packages/frontend/myapp'} | ${'myapp'}          | ${'packages/frontend/myapp'}
      ${'libs/frontend/myapp'}     | ${'myapp'}          | ${'libs/frontend/myapp'}
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
