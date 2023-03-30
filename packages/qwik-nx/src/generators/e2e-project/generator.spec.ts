import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';
import { appGenerator } from './../application/generator';

import generator from './generator';
import { E2eProjectGeneratorSchema } from './schema';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const devkit = require('@nrwl/devkit');
const getInstalledNxVersionModule = require('../../utils/get-installed-nx-version');

describe('e2e project', () => {
  let appTree: Tree;
  const defaultOptions: Omit<E2eProjectGeneratorSchema, 'e2eTestRunner'> = {
    project: 'myapp',
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
    expect(config.targets?.e2e.executor).toEqual('@nrwl/cypress:cypress');
    expect(appTree.exists('apps/myapp-e2e/cypress.config.ts')).toBeTruthy();
  });
});
