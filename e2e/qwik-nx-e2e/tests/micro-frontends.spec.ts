import {
  checkFilesExist,
  ensureNxProject,
  readFile,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';

import {
  runCommandUntil,
  promisifiedTreeKill,
  killPort,
  stripConsoleColors,
  killPorts,
} from '@qwikifiers/e2e/utils';

describe('Micro-frontends e2e', () => {
  let project: string, remote1: string, remote2;

  beforeAll(async () => {
    await killPorts(4200, 4201, 4202);
    ensureNxProject('qwik-nx', 'dist/packages/qwik-nx');
  });

  beforeAll(async () => {
    project = uniq('qwik-nx');
    remote1 = uniq('qwik-nx');
    remote2 = uniq('qwik-nx');
    await runNxCommandAsync(
      `generate qwik-nx:host ${project} --remotes=${remote1},${remote2} --no-interactive `
    );
  }, 200000);

  afterAll(async () => {
    await runNxCommandAsync('reset');
  });

  it('should create host and remote applications', async () => {
    expect(() =>
      checkFilesExist(`apps/${project}/vite.config.ts`)
    ).not.toThrow();
    expect(() =>
      checkFilesExist(`apps/${remote1}/vite.config.ts`)
    ).not.toThrow();
    expect(() =>
      checkFilesExist(`apps/${remote2}/vite.config.ts`)
    ).not.toThrow();
    const configFilePath = `apps/${project}/src/config/remotes.json`;
    expect(() => checkFilesExist(configFilePath)).not.toThrow();
    const config = readJson(configFilePath);
    expect(config[remote1]).toEqual('http://localhost:4201');
    expect(config[remote2]).toEqual('http://localhost:4202');
  }, 200000);

  it('should be able to build host and remotes', async () => {
    const checkProject = async (name) => {
      const result = await runNxCommandAsync(`build-ssr ${name}`);
      expect(result.stdout).toContain(
        `Successfully ran target build-ssr for project ${name}`
      );
      expect(() =>
        checkFilesExist(`dist/apps/${name}/client/q-manifest.json`)
      ).not.toThrow();
      expect(() =>
        checkFilesExist(`dist/apps/${name}/server/entry.preview.mjs`)
      ).not.toThrow();
    };
    await checkProject(project);
    await checkProject(remote1);
    await checkProject(remote2);
  }, 200000);

  it('should serve host and remotes in dev mode', async () => {
    const port = 4200;
    let invokedRemote1 = false;
    let invokedRemote2 = false;
    let showedAllRemotesInvokedInfo = false;
    let invokedHost = false;
    const p = await runCommandUntil(`run ${project}:serve`, (output) => {
      invokedHost ||= stripConsoleColors(output).includes(
        `Local:   http://localhost:4200/`
      );
      invokedRemote1 ||= stripConsoleColors(output).includes(
        `${remote1.toUpperCase()}   ➜  Local:   http://localhost:4201/`
      );
      invokedRemote2 ||= stripConsoleColors(output).includes(
        `${remote2.toUpperCase()}   ➜  Local:   http://localhost:4202/`
      );
      showedAllRemotesInvokedInfo ||= stripConsoleColors(
        output.replace(/\n|\s/g, '')
      ).includes(
        [
          'Preliminary actions completed',
          `Successfully instantiated "serve" targets of ${project}'s remotes.`,
          `Starting the ${project}'s dev server..`,
        ]
          .join('')
          .replace(/\n|\s/g, '')
      );

      return invokedHost;
    });
    expect(invokedRemote1).toBeTruthy();
    expect(invokedRemote2).toBeTruthy();
    expect(showedAllRemotesInvokedInfo).toBeTruthy();
    expect(invokedHost).toBeTruthy();

    try {
      await promisifiedTreeKill(p.pid, 'SIGKILL');
      await killPort(port);
    } catch {
      // ignore
    }
  }, 200000);

  // TODO: check for the preview to be working

  it('should be able to add a new remote to the existing setup', () => {
    // TODO
  });
  
});
