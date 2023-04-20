import 'isomorphic-fetch';

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
  killPorts,
  DEFAULT_E2E_TIMEOUT,
} from '@qwikifiers/e2e/utils';

export function testApplicationBasicBehavior(generator: 'app' | 'preset') {
  const devServerPort = 4212;
  const previewServerPort = 4232;
  describe(`Basic behavior with ${generator} generator`, () => {
    let project: string;

    beforeAll(async () => {
      await killPorts(devServerPort, previewServerPort);
      ensureNxProject('qwik-nx', 'dist/packages/qwik-nx');
    }, 10000);

    beforeAll(async () => {
      project = uniq('qwik-nx');

      const projectNameParam =
        generator === 'preset' ? `--qwikAppName=${project}` : project;

      await runNxCommandAsync(
        `generate qwik-nx:${generator} ${projectNameParam} --no-interactive`
      );
      await runNxCommandAsync(
        `generate qwik-nx:component my-test-component --project=${project} --unitTestRunner=vitest --no-interactive`
      );
    }, DEFAULT_E2E_TIMEOUT);

    afterAll(async () => {
      await runNxCommandAsync('reset');
    });

    it('should contain tsconfig.base.json', () => {
      expect(() => checkFilesExist(`tsconfig.base.json`)).not.toThrow();
    });

    it(
      'should create qwik-nx',
      async () => {
        const result = await runNxCommandAsync(`build ${project}`);
        expect(
          stripConsoleColors(result.stdout.replace(/\n|\s/g, ''))
        ).toContain(
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
      },
      DEFAULT_E2E_TIMEOUT
    );

    it(
      'unit tests should pass in the created app',
      async () => {
        const result = await runNxCommandAsync(`test ${project}`);
        expect(result.stdout).toContain(
          `Successfully ran target test for project ${project}`
        );
        expect(stripConsoleColors(result.stdout)).toContain(
          `Test Files  1 passed`
        );
      },
      DEFAULT_E2E_TIMEOUT
    );

    it(
      'should run build with a specified configuration',
      async () => {
        // TODO: cloudflare pages or custom configurations should also be tested
        const result = await runNxCommandAsync(
          `build ${project} --configuration=preview`
        );
        expect(
          stripConsoleColors(result.stdout.replace(/\n|\s/g, ''))
        ).toContain(
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
      },
      DEFAULT_E2E_TIMEOUT
    );

    it(
      'should serve application in dev mode with custom port',
      async () => {
        let host: string | undefined;
        const p = await runCommandUntil(
          `run ${project}:serve --port=${devServerPort}`,
          (output) => {
            host = getHostOutput(output, devServerPort);
            return !!host;
          }
        );
        await checkPageResponses(host!);
        try {
          await promisifiedTreeKill(p.pid!, 'SIGKILL');
          await killPort(devServerPort);
        } catch {
          // ignore
        }
      },
      DEFAULT_E2E_TIMEOUT
    );

    it(
      'should serve application in preview mode with custom port',
      async () => {
        let host: string | undefined;
        const p = await runCommandUntil(
          `run ${project}:preview --port=${previewServerPort}`,
          (output) => {
            host = getHostOutput(output, previewServerPort);
            return !!host;
          }
        );
        await checkPageResponses(host!);
        try {
          await promisifiedTreeKill(p.pid!, 'SIGKILL');
          await killPort(previewServerPort);
        } catch {
          // ignore
        }
      },
      DEFAULT_E2E_TIMEOUT
    );
  });
}

async function checkPageResponses(host: string) {
  // wait for a while to make sure everything is settled
  await new Promise((r) => setTimeout(r, 3000));
  const domParser = new DOMParser();
  const pages = ['', 'flower'];
  for (const page of pages) {
    const url = `${host}/${page}`;
    const res = await fetch(url, { headers: { accept: 'text/html' } }).then(
      (r) => r.text()
    );
    const html = domParser.parseFromString(res, 'text/html');
    expectHtmlOnAPage(html, page);
  }
}

function getHostOutput(output: string, port: number): string | undefined {
  // extracts the host url from the output message
  // the reason it's done is because it can either be in these formats:
  // http://localhost:4200 or https://127.0.0.1:4200
  const regexp = new RegExp(
    `Local:(?:\\s{3})(http(?:s)?:\\/\\/(?:.+):${port})`
  );
  return output.match(regexp)?.[1];
}

function expectHtmlOnAPage(html: Document, page: string) {
  switch (page) {
    case '':
      expectHtmlOnARootPage(html);
      break;
    case 'flower':
      expectHtmlOnAFlowerPage(html);
      break;
  }
}

function expectHtmlOnARootPage(html: Document) {
  expectCommonHtml(html);

  expect(html.querySelector('.mindblow')?.textContent).toContain(
    'Blow my mind'
  );
}

function expectHtmlOnAFlowerPage(html: Document) {
  expectCommonHtml(html);

  expect(html.querySelector('input[type="range"]')).toBeTruthy();
}

function expectCommonHtml(html: Document) {
  const headerLinks = html.querySelectorAll('header li a');
  expect(headerLinks.length).toBe(3);
  expect(Array.from(headerLinks).map((l) => l.textContent)).toEqual([
    'Docs',
    'Examples',
    'Tutorials',
  ]);
  expect(html.querySelector('footer')?.textContent).toContain(
    'Made with ♡ by Builder.io'
  );
}
