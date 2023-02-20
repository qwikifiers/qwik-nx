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
  stripConsoleColors,
} from '@qwikifiers/e2e/utils';

export function testApplicationBasicBehavior(generator: 'app' | 'preset') {
  describe(`Basic behavior with ${generator} generator`, () => {
    let project: string;

    beforeAll(() => {
      ensureNxProject('qwik-nx', 'dist/packages/qwik-nx');
    });

    beforeAll(async () => {
      project = uniq('qwik-nx');

      const projectNameParam =
        generator === 'preset' ? `--qwikAppName=${project}` : project;

      await runNxCommandAsync(
        `generate qwik-nx:${generator} ${projectNameParam} --no-interactive`
      );
    }, 200000);

    afterAll(async () => {
      await runNxCommandAsync('reset');
    });

    it('should create qwik-nx', async () => {
      const result = await runNxCommandAsync(`build ${project}`);
      expect(stripConsoleColors(result.stdout.replace(/\n|\s/g, ''))).toContain(
        [
          'Targets to be executed:',
          `${project}:build.client`,
          `${project}:build.ssr`,
        ]
          .join('')
          .replace(/\n|\s/g, '')
      );
      expect(result.stdout).toContain(
        `Successfully ran target build for project ${project}`
      );
      expect(() =>
        checkFilesExist(`dist/apps/${project}/client/q-manifest.json`)
      ).not.toThrow();
      expect(() =>
        checkFilesExist(`dist/apps/${project}/server/entry.preview.mjs`)
      ).not.toThrow();
    }, 200000);

    it('should run build with a specified configuration', async () => {
      // TODO: cloudflare pages or custom configurations should also be tested
      const result = await runNxCommandAsync(
        `build ${project} --configuration=preview`
      );
      expect(stripConsoleColors(result.stdout.replace(/\n|\s/g, ''))).toContain(
        [
          'Targets to be executed:',
          `${project}:build.client:preview`,
          `${project}:build.ssr:preview`,
        ]
          .join('')
          .replace(/\n|\s/g, '')
      );
      expect(result.stdout).toContain(
        `Successfully ran target build for project ${project}`
      );
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
}
