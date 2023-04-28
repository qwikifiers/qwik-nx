import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import {
  Tree,
  readProjectConfiguration,
  readJson,
  updateProjectConfiguration,
} from '@nx/devkit';

import { cloudflarePagesIntegrationGenerator } from './generator';
import applicationGenerator from './../../application/generator';
import { CloudflarePagesIntegrationGeneratorSchema } from './schema';
import { Linter } from '@nx/linter';

describe('cloudflare-pages-integration generator', () => {
  let appTree: Tree;
  const projectName = 'test-project';
  const options: CloudflarePagesIntegrationGeneratorSchema = {
    project: projectName,
  };

  beforeEach(async () => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

    await applicationGenerator(appTree, {
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
    expect(config.targets!['build.ssr'].configurations!['production']).toEqual({
      configFile: `apps/${projectName}/adapters/cloudflare-pages/vite.config.ts`,
    });
    expect(config.targets!['deploy']).toEqual({
      executor: '@k11r/nx-cloudflare-wrangler:deploy-page',
      options: {
        dist: `dist/apps/${projectName}/client`,
      },
      dependsOn: ['build-cloudflare'],
    });
    expect(config.targets!['preview-cloudflare']).toEqual({
      executor: '@k11r/nx-cloudflare-wrangler:serve-page',
      options: {
        dist: `dist/apps/${projectName}/client`,
      },
      dependsOn: ['build-cloudflare'],
    });
    expect(config.targets!['build-cloudflare']).toEqual({
      executor: 'nx:run-commands',
      options: {
        command: `npx nx run ${projectName}:build:production`,
      },
    });
  });

  it('should use other target name if deploy target is already defined', async () => {
    const configBefore = readProjectConfiguration(appTree, projectName);
    configBefore.targets!['deploy'] = { executor: 'nx:noop' };
    updateProjectConfiguration(appTree, projectName, configBefore);

    await cloudflarePagesIntegrationGenerator(appTree, options);

    const config = readProjectConfiguration(appTree, projectName);
    expect(config.targets!['build.ssr'].configurations!['production']).toEqual({
      configFile: `apps/${projectName}/adapters/cloudflare-pages/vite.config.ts`,
    });
    expect(config.targets!['deploy']).toEqual({ executor: 'nx:noop' });
    expect(config.targets!['deploy.cloudflare'].executor).toEqual(
      '@k11r/nx-cloudflare-wrangler:deploy-page'
    );
  });

  it('should use the name of the integration if configuration name "production" is already defined', async () => {
    const configBefore = readProjectConfiguration(appTree, projectName);
    configBefore.targets!['build.ssr'].configurations!['production'] = {};
    updateProjectConfiguration(appTree, projectName, configBefore);

    await cloudflarePagesIntegrationGenerator(appTree, options);

    const config = readProjectConfiguration(appTree, projectName);
    expect(
      config.targets!['build'].configurations!['production']
    ).toBeUndefined();
    expect(config.targets!['build.ssr'].configurations!['production']).toEqual(
      {}
    );
    expect(config.targets!['build.ssr'].configurations!['cloudflare']).toEqual({
      configFile: `apps/${projectName}/adapters/cloudflare-pages/vite.config.ts`,
    });
    expect(config.targets!['deploy'].executor).toEqual(
      '@k11r/nx-cloudflare-wrangler:deploy-page'
    );
    expect(config.targets!['build-cloudflare']).toEqual({
      executor: 'nx:run-commands',
      options: {
        command: `npx nx run ${projectName}:build:cloudflare`,
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
    it('project is not an application', async () => {
      const config = readProjectConfiguration(appTree, projectName);
      config.projectType = 'library';
      updateProjectConfiguration(appTree, projectName, config);

      await expect(
        cloudflarePagesIntegrationGenerator(appTree, options)
      ).rejects.toThrow(
        'Cannot setup cloudflare integration for the given project.'
      );
    });

    it('project does not have Qwik\'s "build-ssr" target', async () => {
      const config = readProjectConfiguration(appTree, projectName);
      config.targets!.build.executor = 'nx:run-commands';
      updateProjectConfiguration(appTree, projectName, config);

      await expect(
        cloudflarePagesIntegrationGenerator(appTree, options)
      ).rejects.toThrow('Project contains invalid configuration.');
    });
  });
});
