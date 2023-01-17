import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';

import generator from './generator';
import { QwikAppGeneratorSchema } from './schema';
import { Linter } from '@nrwl/linter';

describe('qwik-nx generator', () => {
  let appTree: Tree;
  const defaultOptions: QwikAppGeneratorSchema = {
    name: 'test',
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
    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
  });

  describe('e2e project', () => {
    it('should not add e2e project', async () => {
      await generator(appTree, {
        ...defaultOptions,
        e2eTestRunner: 'none',
      });
      const config = readProjectConfiguration(appTree, 'test-e2e');
      expect(config).not.toBeDefined();
    });

    it('should add playwright', async () => {
      await generator(appTree, {
        ...defaultOptions,
        name: 'myapp-pw',
        e2eTestRunner: 'playwright',
      });
      const config = readProjectConfiguration(appTree, 'myapp-pw-e2e');
      expect(config).toBeDefined();
      expect(config.targets.e2e.executor).toEqual('@nxkit/playwright:test');
    });

    it('should add cypress', async () => {
      await generator(appTree, {
        ...defaultOptions,
        name: 'myapp-cy',
        e2eTestRunner: 'cypress',
      });
      const config = readProjectConfiguration(appTree, 'myapp-cy-e2e');
      expect(config).toBeDefined();
      expect(config.targets.e2e.executor).toEqual('@nrwl/cypress:cypress');
    });
  });
});
