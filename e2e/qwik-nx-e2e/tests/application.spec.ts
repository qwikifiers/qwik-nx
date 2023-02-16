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
} from '@qwikifiers/e2e/utils';

describe('appGenerator e2e', () => {
  // Setting up individual workspaces per
  // test can cause e2e runs to take a long time.
  // For this reason, we recommend each suite only
  // consumes 1 workspace. The tests should each operate
  // on a unique project in the workspace, such that they
  // are not dependant on one another.
  beforeAll(() => {
    ensureNxProject('qwik-nx', 'dist/packages/qwik-nx');
  });

  afterAll(async () => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    await runNxCommandAsync('reset');
  });

  describe('Basic behavior', () => {
    let project: string;
    beforeAll(async () => {
      project = uniq('qwik-nx');
      await runNxCommandAsync(
        `generate qwik-nx:app ${project} --no-interactive`
      );
    }, 200000);

    it('should create qwik-nx', async () => {
      const result = await runNxCommandAsync(`build-ssr ${project}`);
      expect(result.stdout).toContain(
        `Successfully ran target build-ssr for project ${project}`
      );
      expect(() =>
        checkFilesExist(`dist/apps/${project}/client/q-manifest.json`)
      ).not.toThrow();
      expect(() =>
        checkFilesExist(`dist/apps/${project}/server/entry.preview.mjs`)
      ).not.toThrow();
    }, 200000);

    it('should serve application in dev mode with custom port', async () => {
      const port = 4212;
      const p = await runCommandUntil(
        `run ${project}:serve --port=${port}`,
        (output) => {
          return output.includes('Local:') && output.includes(`:${port}`);
        }
      );
      try {
        await promisifiedTreeKill(p.pid!, 'SIGKILL');
        await killPort(port);
      } catch {
        // ignore
      }
    }, 200000);

    it('should serve application in preview mode with custom port', async () => {
      const port = 4232;
      const p = await runCommandUntil(
        `run ${project}:preview --port=${port}`,
        (output) => {
          return output.includes('Local:') && output.includes(`:${port}`);
        }
      );
      try {
        await promisifiedTreeKill(p.pid!, 'SIGKILL');
        await killPort(port);
      } catch {
        // ignore
      }
    }, 200000);
  });
});
