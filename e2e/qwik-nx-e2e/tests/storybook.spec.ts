import {
  checkFilesExist,
  ensureNxProject,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';

import {
  runCommandUntil,
  promisifiedTreeKill,
  killPort,
  killPorts,
  DEFAULT_E2E_TIMEOUT,
} from '@qwikifiers/e2e/utils';
import { normalize } from 'path';

const STORYBOOK_PORT = 4400;

describe('qwikNxVite plugin e2e', () => {
  beforeAll(async () => {
    await killPorts(STORYBOOK_PORT);
    ensureNxProject('qwik-nx', 'dist/packages/qwik-nx');
  }, 10000);

  afterAll(async () => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    await runNxCommandAsync('reset');
  });

  describe('should be able to import components from libraries', () => {
    const appProject = uniq('qwik-nx');
    const libProject = uniq('qwik-nx');
    const secondLibProject = uniq('qwik-nx');

    describe('Applying storybook for existing application', () => {
      beforeAll(async () => {
        await runNxCommandAsync(
          `generate qwik-nx:app ${appProject} --e2eTestRunner=none --no-interactive`
        );
        await runNxCommandAsync(
          `generate qwik-nx:storybook-configuration ${appProject} --no-interactive`
        );
        await addAdditionalStories(appProject);
      }, DEFAULT_E2E_TIMEOUT);
      checkStorybookIsBuiltAndServed(appProject, 'apps');
    });
    describe('Applying storybook for existing library', () => {
      beforeAll(async () => {
        await runNxCommandAsync(
          `generate qwik-nx:library ${libProject} --no-interactive`
        );
        await runNxCommandAsync(
          `generate qwik-nx:storybook-configuration ${libProject} --no-interactive`
        );
        await addAdditionalStories(libProject);
      }, DEFAULT_E2E_TIMEOUT);
      checkStorybookIsBuiltAndServed(libProject, 'libs');
    });

    describe('Generating a new library with storybook configuration', () => {
      beforeAll(async () => {
        await runNxCommandAsync(
          `generate qwik-nx:library ${secondLibProject} --storybookConfiguration=true --no-interactive`
        );
        await addAdditionalStories(secondLibProject);
      }, DEFAULT_E2E_TIMEOUT);
      checkStorybookIsBuiltAndServed(secondLibProject, 'libs');
    });
  });
});

async function addAdditionalStories(projectName: string): Promise<void> {
  await runNxCommandAsync(
    `generate qwik-nx:component mycomponent --project=${projectName} --generateStories --no-interactive`
  );
  await runNxCommandAsync(
    `generate qwik-nx:component mydefaultcomponent --project=${projectName} --generateStories --exportDefault --no-interactive`
  );
}

function checkStorybookIsBuiltAndServed(
  projectName: string,
  type: 'apps' | 'libs'
) {
  it(
    `should be able to build storybook for the "${projectName}"`,
    async () => {
      const result = await runNxCommandAsync(`build-storybook ${projectName}`);
      expect(result.stdout).toContain(
        `Successfully ran target build-storybook for project ${projectName}`
      );
      expect(() =>
        checkFilesExist(`dist/storybook/${projectName}/index.html`)
      ).not.toThrow();
    },
    DEFAULT_E2E_TIMEOUT
  );

  it(
    `should serve storybook for the "${projectName}"`,
    async () => {
      let resultOutput: string | undefined;
      const p = await runCommandUntil(
        `run ${projectName}:storybook`,
        (output) => {
          if (
            output.includes('Local:') &&
            output.includes(`:${STORYBOOK_PORT}`)
          ) {
            resultOutput = output;
            return true;
          }
          return false;
        }
      );

      const mdxPattern = normalize(`${type}/${projectName}/**/*.stories.mdx`);

      // it is expected that projects won't have stories by default and storybook should recognize it.
      expect(resultOutput).toContain(
        `No story files found for the specified pattern: ${mdxPattern}`
      );
      try {
        await promisifiedTreeKill(p.pid!, 'SIGKILL');
        await killPort(STORYBOOK_PORT);
      } catch {
        // ignore
      }
    },
    DEFAULT_E2E_TIMEOUT
  );
}
