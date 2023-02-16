import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import {
  Tree,
  readProjectConfiguration,
  readJson,
  updateProjectConfiguration,
} from '@nrwl/devkit';

import { cloudflarePagesIntegrationGenerator } from './generator';
import applicationGenerator from './../../application/generator';
import { CloudflarePagesIntegrationGeneratorSchema } from './schema';
import { Linter } from '@nrwl/linter';

describe('cloudflare-pages-integration generator', () => {
  let appTree: Tree;
  const projectName = 'test-project';
  const options: CloudflarePagesIntegrationGeneratorSchema = {
    project: projectName,
  };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

    applicationGenerator(appTree, {
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
    await cloudflarePagesIntegrationGenerator(appTree, options);
    const config = readProjectConfiguration(appTree, projectName);
    expect(
      config.targets!['build-ssr'].configurations!['cloudflare-pages']
    ).toEqual({
      configFile: `apps/${projectName}/adaptors/cloudflare-pages/vite.config.ts`,
    });
    expect(config.targets!['deploy']).toEqual({
      executor: '@k11r/nx-cloudflare-wrangler:deploy-page',
      options: {
        dist: `dist/apps/${projectName}/client`,
      },
      dependsOn: ['build-ssr-cloudflare-pages'],
    });
    expect(config.targets!['preview-cloudflare-pages']).toEqual({
      executor: '@k11r/nx-cloudflare-wrangler:serve-page',
      options: {
        dist: `dist/apps/${projectName}/client`,
      },
      dependsOn: ['build-ssr-cloudflare-pages'],
    });
    expect(config.targets!['build-ssr-cloudflare-pages']).toEqual({
      executor: 'nx:run-commands',
      options: {
        command: `npx nx run ${projectName}:build-ssr:cloudflare-pages`,
      },
    });
  });

  it('should add required dependencies', async () => {
    await cloudflarePagesIntegrationGenerator(appTree, options);
    const { devDependencies } = readJson(appTree, 'package.json');
    expect(devDependencies['wrangler']).toBeDefined();
    expect(devDependencies['@k11r/nx-cloudflare-wrangler']).toBeDefined();
  });

  describe('should throw if project configuration does not meet the expectations', () => {
    it('deploy target is already defined', async () => {
      const config = readProjectConfiguration(appTree, projectName);
      config.targets!['deploy'] = { executor: 'nx:noop' };
      updateProjectConfiguration(appTree, projectName, config);

      expect(
        cloudflarePagesIntegrationGenerator(appTree, options)
      ).rejects.toThrow(
        `"deploy" target has already been configured for ${options.project}`
      );
    });
    it('project is not an application', async () => {
      const config = readProjectConfiguration(appTree, projectName);
      config.projectType = 'library';
      updateProjectConfiguration(appTree, projectName, config);

      expect(
        cloudflarePagesIntegrationGenerator(appTree, options)
      ).rejects.toThrow(
        'Cannot setup cloudflare integration for the given project.'
      );
    });

    it('project does not have Qwik\'s "build-ssr" target', async () => {
      const config = readProjectConfiguration(appTree, projectName);
      delete config.targets!['build-ssr'];
      updateProjectConfiguration(appTree, projectName, config);

      expect(
        cloudflarePagesIntegrationGenerator(appTree, options)
      ).rejects.toThrow(
        'Cannot setup cloudflare integration for the given project.'
      );
    });
  });
});
