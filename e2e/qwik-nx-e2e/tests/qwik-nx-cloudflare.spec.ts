import {
  checkFilesExist,
  ensureNxProject,
  runNxCommandAsync,
  uniq,
} from '@nx/plugin/testing';

import {
  runCommandUntil,
  promisifiedTreeKill,
  killPort,
  killPorts,
  DEFAULT_E2E_TIMEOUT,
} from '@qwikifiers/e2e/utils';

const CLOUDFLARE_PREVIEW_PORT = 4300;

describe('qwik nx cloudflare generator', () => {
  // Setting up individual workspaces per
  // test can cause e2e runs to take a long time.
  // For this reason, we recommend each suite only
  // consumes 1 workspace. The tests should each operate
  // on a unique project in the workspace, such that they
  // are not dependant on one another.
  beforeAll(async () => {
    await killPorts(CLOUDFLARE_PREVIEW_PORT);
    ensureNxProject('qwik-nx', 'dist/packages/qwik-nx');
  }, 10000);

  afterAll(async () => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    await runNxCommandAsync('reset');
  });

  describe('should build and serve a project with the cloudflare adapter', () => {
    let project: string;
    beforeAll(async () => {
      project = uniq('qwik-nx');
      await runNxCommandAsync(
        `generate qwik-nx:app ${project} --no-interactive`
      );
      await runNxCommandAsync(
        `generate qwik-nx:cloudflare-pages-integration ${project} --no-interactive`
      );

      // move header component into the library
    }, DEFAULT_E2E_TIMEOUT);

    it(
      'should be able to successfully build the application',
      async () => {
        const result = await runNxCommandAsync(`build-cloudflare ${project}`);
        expect(result.stdout).toContain(
          `Successfully ran target build for project ${project}`
        );
        expect(() =>
          checkFilesExist(`dist/apps/${project}/client/q-manifest.json`)
        ).not.toThrow();
        expect(() =>
          checkFilesExist(
            `dist/apps/${project}/server/entry.cloudflare-pages.js`
          )
        ).not.toThrow();
      },
      DEFAULT_E2E_TIMEOUT
    );

    xit(
      'should serve application in preview mode with custom port',
      async () => {
        const p = await runCommandUntil(
          `run ${project}:preview-cloudflare --port=${CLOUDFLARE_PREVIEW_PORT}`,
          (output) => {
            return (
              output.includes('Local:') &&
              output.includes(`:${CLOUDFLARE_PREVIEW_PORT}`)
            );
          }
        );
        try {
          await promisifiedTreeKill(p.pid!, 'SIGKILL');
          await killPort(CLOUDFLARE_PREVIEW_PORT);
        } catch {
          // ignore
        }
      },
      DEFAULT_E2E_TIMEOUT
    );
  });
});
