import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';

import generator from './generator';
import { QwikAppGeneratorSchema } from './schema';
import { Linter } from '@nrwl/linter';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const devkit = require('@nrwl/devkit');
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
    expect(
      appTree.listChanges().map((c) => ({ path: c.path, type: c.type }))
    ).toMatchSnapshot();
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
      expect(config.targets?.e2e.executor).toEqual('@nrwl/cypress:cypress');
      expect(appTree.exists('apps/myapp-e2e/cypress.config.ts')).toBeTruthy();
    });
  });
});
