import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import {
  Tree,
  readProjectConfiguration,
  readJson,
  updateProjectConfiguration,
} from '@nx/devkit';

import { netlifyIntegrationGenerator } from './generator';
import applicationGenerator from './../../application/generator';
import { NetlifyIntegrationGeneratorSchema } from './schema';
import { Linter } from '@nx/linter';
import { getFormattedListChanges } from './../../../utils/testing-generators';

describe('netlify-integration generator', () => {
  let appTree: Tree;
  const projectName = 'test-project';
  const options: NetlifyIntegrationGeneratorSchema = {
    project: projectName,
  };

  beforeEach(async () => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

    appTree.write('.gitignore', '');

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
    const initialChangesToOmit = getFormattedListChanges(appTree);
    await netlifyIntegrationGenerator(appTree, options);
    expect(
      getFormattedListChanges(appTree, initialChangesToOmit)
    ).toMatchSnapshot();

    const config = readProjectConfiguration(appTree, projectName);
    expect(config.targets!['build.ssr'].configurations!['production']).toEqual({
      configFile: `apps/${projectName}/adapters/netlify/vite.config.ts`,
    });
    expect(config.targets!['deploy-netlify']).toEqual({
      executor: 'qwik-nx:exec',
      options: {
        command: 'npx netlify deploy --build --dir=client',
        cwd: `dist/apps/${projectName}`,
      },
      dependsOn: ['build-netlify'],
    });
    expect(config.targets!['preview-netlify']).toEqual({
      executor: 'qwik-nx:exec',
      options: {
        command: 'npx netlify dev --dir=client',
        cwd: `dist/apps/${projectName}`,
      },
      dependsOn: ['build-netlify'],
    });
    expect(config.targets!['build-netlify']).toEqual({
      executor: 'nx:run-commands',
      options: {
        command: `npx nx run ${projectName}:build:production`,
      },
    });
  });

  it('should use the name of the integration if configuration name "production" is already defined', async () => {
    const configBefore = readProjectConfiguration(appTree, projectName);
    configBefore.targets!['build.ssr'].configurations!['production'] = {};
    updateProjectConfiguration(appTree, projectName, configBefore);

    await netlifyIntegrationGenerator(appTree, options);

    const config = readProjectConfiguration(appTree, projectName);
    expect(
      config.targets!['build'].configurations!['production']
    ).toBeUndefined();
    expect(config.targets!['build.ssr'].configurations!['production']).toEqual(
      {}
    );
    expect(config.targets!['build.ssr'].configurations!['netlify']).toEqual({
      configFile: `apps/${projectName}/adapters/netlify/vite.config.ts`,
    });
    expect(config.targets!['build-netlify']).toEqual({
      executor: 'nx:run-commands',
      options: {
        command: `npx nx run ${projectName}:build:netlify`,
      },
    });
  });

  it('should add required dependencies', async () => {
    await netlifyIntegrationGenerator(appTree, options);
    const { devDependencies } = readJson(appTree, 'package.json');
    expect(devDependencies['netlify-cli']).toBeDefined();
  });

  describe('should throw if project configuration does not meet the expectations', () => {
    it('project is not an application', async () => {
      const config = readProjectConfiguration(appTree, projectName);
      config.projectType = 'library';
      updateProjectConfiguration(appTree, projectName, config);

      await expect(
        netlifyIntegrationGenerator(appTree, options)
      ).rejects.toThrow(
        'Cannot setup netlify integration for the given project.'
      );
    });

    it('project does not have Qwik\'s "build-ssr" target', async () => {
      const config = readProjectConfiguration(appTree, projectName);
      config.targets!.build.executor = 'nx:run-commands';
      updateProjectConfiguration(appTree, projectName, config);

      await expect(
        netlifyIntegrationGenerator(appTree, options)
      ).rejects.toThrow('Project contains invalid configuration.');
    });
  });
});
