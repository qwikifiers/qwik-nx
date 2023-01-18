import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';

import generator from './generator';
import { QwikAppGeneratorSchema } from './schema';
import { Linter } from '@nrwl/linter';

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

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await generator(appTree, defaultOptions);
    const config = readProjectConfiguration(appTree, 'myapp');
    expect(config).toBeDefined();
  });

  describe('e2e project', () => {
    it('--e2eTestRunner none', async () => {
      await generator(appTree, {
        ...defaultOptions,
        e2eTestRunner: 'none',
      });
      const config = readProjectConfiguration(appTree, 'myapp-e2e');
      expect(config).not.toBeDefined();
    });

    it('--e2eTestRunner playwright', async () => {
      await generator(appTree, {
        ...defaultOptions,
        e2eTestRunner: 'playwright',
      });
      const config = readProjectConfiguration(appTree, 'myapp-e2e');
      expect(config).toBeDefined();
      expect(config.targets.e2e.executor).toEqual('@nxkit/playwright:test');
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
      expect(config.targets.e2e.executor).toEqual('@nrwl/cypress:cypress');
      expect(appTree.exists('apps/myapp-e2e/cypress.config.ts')).toBeTruthy();
    });
  });
});
