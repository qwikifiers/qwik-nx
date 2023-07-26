import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import {
  Tree,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nx/devkit';

import { denoIntegrationGenerator } from './generator';
import applicationGenerator from './../../application/generator';
import { DenoIntegrationGeneratorSchema } from './schema';
import { Linter } from '@nx/linter';

describe('deno-integration generator', () => {
  let appTree: Tree;
  const projectName = 'test-project';
  const options: DenoIntegrationGeneratorSchema = {
    project: projectName,
    denoProjectName: 'cute-frog-420',
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
    await denoIntegrationGenerator(appTree, options);
    const config = readProjectConfiguration(appTree, projectName);

    expect(config.targets!['build.ssr'].configurations!['production']).toEqual({
      configFile: `apps/${projectName}/adapters/deno/vite.config.ts`,
    });

    expect(config.targets!['deploy']).toEqual({
      executor: 'nx:run-commands',
      options: {
        cwd: `dist/apps/${projectName}/client`,
        command: `deployctl deploy --project=${options.denoProjectName} https://deno.land/std/http/file_server.ts --dry-run`,
      },
      configurations: {
        preview: {
          command: `deployctl deploy --project=${options.denoProjectName} https://deno.land/std/http/file_server.ts`,
        },
        production: {
          command: `deployctl deploy --project=${options.denoProjectName} --prod https://deno.land/std/http/file_server.ts`,
        },
      },
      dependsOn: ['build-deno'],
    });

    expect(config.targets!['preview-deno']).toEqual({
      executor: 'nx:run-commands',
      options: {
        command: `deno run --allow-net --allow-read --allow-env dist/apps/${projectName}/server/entry.deno.js`,
      },
      dependsOn: ['build-deno'],
    });

    expect(config.targets!['build-deno']).toEqual({
      executor: 'nx:run-commands',
      options: {
        command: `npx nx run ${options.project}:build:production`,
      },
    });
  });

  it('should use other target name if deploy target is already defined', async () => {
    const configBefore = readProjectConfiguration(appTree, projectName);
    configBefore.targets!['deploy'] = { executor: 'nx:noop' };
    updateProjectConfiguration(appTree, projectName, configBefore);

    await denoIntegrationGenerator(appTree, options);

    const config = readProjectConfiguration(appTree, projectName);
    expect(config.targets!['build.ssr'].configurations!['production']).toEqual({
      configFile: `apps/${projectName}/adapters/deno/vite.config.ts`,
    });
    expect(config.targets!['deploy']).toEqual({ executor: 'nx:noop' });
    expect(config.targets!['deploy.deno']).toEqual({
      executor: 'nx:run-commands',
      options: {
        cwd: `dist/apps/${projectName}/client`,
        command: `deployctl deploy --project=${options.denoProjectName} https://deno.land/std/http/file_server.ts --dry-run`,
      },
      configurations: {
        preview: {
          command: `deployctl deploy --project=${options.denoProjectName} https://deno.land/std/http/file_server.ts`,
        },
        production: {
          command: `deployctl deploy --project=${options.denoProjectName} --prod https://deno.land/std/http/file_server.ts`,
        },
      },
      dependsOn: ['build-deno'],
    });
  });

  it('should use the name of the integration if configuration name "production" is already defined', async () => {
    const configBefore = readProjectConfiguration(appTree, projectName);
    configBefore.targets!['build.ssr'].configurations!['production'] = {};
    updateProjectConfiguration(appTree, projectName, configBefore);

    await denoIntegrationGenerator(appTree, options);

    const config = readProjectConfiguration(appTree, projectName);
    expect(
      config.targets!['build'].configurations!['production']
    ).toBeUndefined();
    expect(config.targets!['build.ssr'].configurations!['production']).toEqual(
      {}
    );
    expect(config.targets!['build.ssr'].configurations!['deno']).toEqual({
      configFile: `apps/${projectName}/adapters/deno/vite.config.ts`,
    });

    expect(config.targets!['deploy']).toEqual({
      executor: 'nx:run-commands',
      options: {
        cwd: `dist/apps/${projectName}/client`,
        command: `deployctl deploy --project=${options.denoProjectName} https://deno.land/std/http/file_server.ts --dry-run`,
      },
      configurations: {
        preview: {
          command: `deployctl deploy --project=${options.denoProjectName} https://deno.land/std/http/file_server.ts`,
        },
        production: {
          command: `deployctl deploy --project=${options.denoProjectName} --prod https://deno.land/std/http/file_server.ts`,
        },
      },
      dependsOn: ['build-deno'],
    });
    expect(config.targets!['build-deno']).toEqual({
      executor: 'nx:run-commands',
      options: {
        command: `npx nx run ${options.project}:build:deno`,
      },
    });
  });

  it('should generate deploy.yml file for github actions', async () => {
    await denoIntegrationGenerator(appTree, {
      ...options,
      generateGithubHook: true,
    });
    const hasDeployYaml = appTree.exists('.github/workflows/deploy.yml');
    expect(hasDeployYaml).toBeTruthy();
  });

  describe('should throw if project configuration does not meet the expectations', () => {
    it('project is not an application', async () => {
      const config = readProjectConfiguration(appTree, projectName);
      config.projectType = 'library';
      updateProjectConfiguration(appTree, projectName, config);

      await expect(denoIntegrationGenerator(appTree, options)).rejects.toThrow(
        'Cannot setup deno integration for the given project.'
      );
    });

    it('project does not have Qwik\'s "build-ssr" target', async () => {
      const config = readProjectConfiguration(appTree, projectName);
      config.targets!.build.executor = 'nx:run-commands';
      updateProjectConfiguration(appTree, projectName, config);

      await expect(denoIntegrationGenerator(appTree, options)).rejects.toThrow(
        'Project contains invalid configuration.'
      );
    });
  });
});
