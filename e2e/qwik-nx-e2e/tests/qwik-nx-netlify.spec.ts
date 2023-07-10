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

const NETLIFY_PREVIEW_PORT = 8888;

describe('qwik nx netlify generator', () => {
  beforeAll(async () => {
    await killPorts(NETLIFY_PREVIEW_PORT);
    ensureNxProject('qwik-nx', 'dist/packages/qwik-nx');
  }, 10000);

  afterAll(async () => {
    await runNxCommandAsync('reset');
  });

  describe('should build and serve a project with the netlify adapter', () => {
    let project: string;
    beforeAll(async () => {
      project = uniq('qwik-nx');
      await runNxCommandAsync(
        `generate qwik-nx:app ${project} --no-interactive`
      );
      await runNxCommandAsync(
        `generate qwik-nx:netlify-integration ${project} --no-interactive`
      );
    }, DEFAULT_E2E_TIMEOUT);

    it(
      'should be able to successfully build the application',
      async () => {
        const result = await runNxCommandAsync(`build-netlify ${project}`);
        expect(result.stdout).toContain(
          `Successfully ran target build for project ${project}`
        );
        expect(() =>
          checkFilesExist(`dist/apps/${project}/client/q-manifest.json`)
        ).not.toThrow();
        expect(() =>
          checkFilesExist(
            `dist/apps/${project}/.netlify/edge-functions/entry.netlify-edge/entry.netlify-edge.js`
          )
        ).not.toThrow();
      },
      DEFAULT_E2E_TIMEOUT
    );

    it(
      'should serve application in preview mode with custom port',
      async () => {
        const p = await runCommandUntil(
          `run ${project}:preview-netlify`,
          (output) => {
            console.log(output);
            return output.includes('Server now ready on http://localhost:8888');
          }
        );
        try {
          await promisifiedTreeKill(p.pid!, 'SIGKILL');
          await killPort(NETLIFY_PREVIEW_PORT);
        } catch {
          // ignore
        }
      },
      DEFAULT_E2E_TIMEOUT
    );
  });
});
