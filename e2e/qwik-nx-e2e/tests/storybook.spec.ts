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
} from '@qwikifiers/e2e/utils';

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
    beforeAll(async () => {
      await runNxCommandAsync(
        `generate qwik-nx:app ${appProject} --e2eTestRunner=none --no-interactive`
      );
      await runNxCommandAsync(
        `generate qwik-nx:library ${libProject} --no-interactive`
      );
      await runNxCommandAsync(
        `generate qwik-nx:storybook-configuration ${appProject} --no-interactive`
      );
      await runNxCommandAsync(
        `generate qwik-nx:storybook-configuration ${libProject} --no-interactive`
      );
    }, 200000);

    describe('Applying storybook for existing application', () => {
      checkStorybookIsBuiltAndServed(appProject, 'apps', false);
    });
    describe('Applying storybook for existing library', () => {
      checkStorybookIsBuiltAndServed(libProject, 'libs', false);
    });

    describe('Generating a new library with storybook configuration', () => {
      beforeAll(async () => {
        await runNxCommandAsync(
          `generate qwik-nx:library ${secondLibProject} --storybookConfiguration=true --no-interactive`
        );
      }, 200000);
      checkStorybookIsBuiltAndServed(secondLibProject, 'libs', true);
    });
  });
});

function checkStorybookIsBuiltAndServed(
  projectName: string,
  type: 'apps' | 'libs',
  hasTsStories: boolean
) {
  it(`should be able to build storybook for the "${projectName}"`, async () => {
    const result = await runNxCommandAsync(`build-storybook ${projectName}`);
    expect(result.stdout).toContain(
      `Successfully ran target build-storybook for project ${projectName}`
    );
    expect(() =>
      checkFilesExist(`dist/storybook/${projectName}/index.html`)
    ).not.toThrow();
  }, 200000);

  it(`should serve storybook for the "${projectName}"`, async () => {
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

    // it is expected that projects won't have stories by default and storybook should recognize it.
    expect(resultOutput).toContain(
      `No story files found for the specified pattern: ${type}/${projectName}/**/*.stories.mdx`
    );
    if (!hasTsStories) {
      expect(resultOutput).toContain(
        `No story files found for the specified pattern: ${type}/${projectName}/**/*.stories.@(js|jsx|ts|tsx)`
      );
    }
    try {
      await promisifiedTreeKill(p.pid!, 'SIGKILL');
      await killPort(STORYBOOK_PORT);
    } catch {
      // ignore
    }
  }, 200000);
}
