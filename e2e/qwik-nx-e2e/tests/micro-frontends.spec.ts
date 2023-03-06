import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';

import {
  runCommandUntil,
  promisifiedTreeKill,
  stripConsoleColors,
  killPorts,
  DEFAULT_E2E_TIMEOUT,
} from '@qwikifiers/e2e/utils';

const PORTS = [4200, 4201, 4202, 4203];

describe('Micro-frontends e2e', () => {
  let project: string, remote1: string, remote2: string;

  beforeAll(async () => {
    await killPorts(...PORTS);
    ensureNxProject('qwik-nx', 'dist/packages/qwik-nx');
  }, 10000);

  beforeAll(async () => {
    project = uniq('qwik-nx');
    remote1 = uniq('qwik-nx');
    remote2 = uniq('qwik-nx');
    await runNxCommandAsync(
      `generate qwik-nx:host ${project} --remotes=${remote1},${remote2} --no-interactive `
    );
  }, DEFAULT_E2E_TIMEOUT);

  afterAll(async () => {
    await runNxCommandAsync('reset');
  });

  it(
    'should create host and remote applications',
    async () => {
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
    },
    DEFAULT_E2E_TIMEOUT
  );

  it(
    'should be able to build host and remotes',
    async () => {
      const checkProject = async (name: string) => {
        const result = await runNxCommandAsync(`build ${name}`);
        expect(result.stdout).toContain(
          `Successfully ran target build for project ${name}`
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
    },
    DEFAULT_E2E_TIMEOUT
  );

  it(
    'should serve host and remotes in dev mode',
    async () => {
      const result = await runHostAndRemotes(project, remote1, remote2);

      expect(result.invokedRemote1).toBeTruthy();
      expect(result.invokedRemote2).toBeTruthy();
      expect(result.showedAllRemotesInvokedInfo).toBeTruthy();
      expect(result.invokedHost).toBeTruthy();
    },
    DEFAULT_E2E_TIMEOUT
  );

  it(
    'should be able to skip specified remotes in dev mode',
    async () => {
      const result = await runHostAndRemotes(
        project,
        remote1,
        remote2,
        undefined,
        true
      );

      expect(result.invokedRemote1).toBeFalsy();
      expect(result.invokedRemote2).toBeTruthy();
      expect(result.showedAllRemotesInvokedInfo).toBeTruthy();
      expect(result.invokedHost).toBeTruthy();
    },
    DEFAULT_E2E_TIMEOUT
  );

  it(
    'should serve host and remotes in preview mode',
    async () => {
      const result = await previewHostAndRemotes(project, remote1, remote2);

      expect(result.builtRemote1).toBeTruthy();
      expect(result.builtRemote2).toBeTruthy();
      expect(result.builtHost).toBeTruthy();
      expect(result.invokedRemote1).toBeTruthy();
      expect(result.invokedRemote2).toBeTruthy();
      expect(result.showedAllRemotesInvokedInfo).toBeTruthy();
      expect(result.invokedHost).toBeTruthy();
    },
    DEFAULT_E2E_TIMEOUT
  );

  it(
    'should be able to skip specified remotes in preview mode',
    async () => {
      const result = await previewHostAndRemotes(
        project,
        remote1,
        remote2,
        undefined,
        true
      );

      expect(result.builtRemote1).toBeFalsy();
      expect(result.builtRemote2).toBeTruthy();
      expect(result.builtHost).toBeTruthy();
      expect(result.invokedRemote1).toBeFalsy();
      expect(result.invokedRemote2).toBeTruthy();
      expect(result.showedAllRemotesInvokedInfo).toBeTruthy();
      expect(result.invokedHost).toBeTruthy();
    },
    DEFAULT_E2E_TIMEOUT
  );

  it(
    'should be able to add a new remote to the existing setup',
    async () => {
      const remote3 = uniq('qwik-nx');
      await runNxCommandAsync(
        `generate qwik-nx:remote ${remote3} --host=${project} --port=4203 --no-interactive`
      );
      const result = await runNxCommandAsync(`build ${remote3}`);
      expect(result.stdout).toContain(
        `Successfully ran target build for project ${remote3}`
      );
      expect(() =>
        checkFilesExist(`dist/apps/${remote3}/server/entry.preview.mjs`)
      ).not.toThrow();

      const runResult = await runHostAndRemotes(
        project,
        remote1,
        remote2,
        remote3
      );

      expect(runResult.invokedRemote1).toBeTruthy();
      expect(runResult.invokedRemote2).toBeTruthy();
      expect(runResult.invokedRemote3).toBeTruthy();
      expect(runResult.showedAllRemotesInvokedInfo).toBeTruthy();
      expect(runResult.invokedHost).toBeTruthy();
    },
    DEFAULT_E2E_TIMEOUT
  );
});

async function runHostAndRemotes(
  hostName: string,
  remote1: string,
  remote2: string,
  remote3?: string,
  skipFirst = false
) {
  let invokedRemote1 = false;
  let invokedRemote2 = false;
  let invokedRemote3 = false;
  let showedAllRemotesInvokedInfo = false;
  let invokedHost = false;

  let serveHostOptions = '';
  if (skipFirst) {
    serveHostOptions = `--skipRemotes=${remote1}`;
  }
  const p = await runCommandUntil(
    `run ${hostName}:serve ${serveHostOptions}`,
    (output) => {
      const includesInvokeMessage = (
        remote: string,
        port: number,
        includePrefix = true
      ) => {
        const prefix = includePrefix ? `${remote.toUpperCase()}   ➜  ` : '';
        const stripped = stripConsoleColors(output);
        // both resolved ip and "localhost" can be printed
        const ip = `${prefix}Local:   http://127.0.0.1:${port}/`;
        const localhost = `${prefix}Local:   http://localhost:${port}/`;
        return stripped.includes(ip) || stripped.includes(localhost);
      };
      invokedHost ||= includesInvokeMessage(hostName, 4200, false);
      invokedRemote1 ||= includesInvokeMessage(remote1, 4201);
      invokedRemote2 ||= includesInvokeMessage(remote2, 4202);
      invokedRemote3 ||= !!remote3 && includesInvokeMessage(remote3, 4203);

      showedAllRemotesInvokedInfo ||= stripConsoleColors(
        output.replace(/\n|\s/g, '')
      ).includes(
        [
          'Preliminary actions completed',
          `Successfully instantiated "serve" targets of ${hostName}'s remotes.`,
          skipFirst ? `Skipped targets: ${remote1}` : null,
          `Starting the ${hostName}'s dev server..`,
        ]
          .filter(Boolean)
          .join('')
          .replace(/\n|\s/g, '')
      );

      return invokedHost;
    }
  );

  try {
    await promisifiedTreeKill(p.pid!, 'SIGKILL');
    await killPorts(...PORTS);
  } catch {
    // ignore
  }

  return {
    invokedRemote1,
    invokedRemote2,
    invokedRemote3,
    showedAllRemotesInvokedInfo,
    invokedHost,
  };
}

async function previewHostAndRemotes(
  hostName: string,
  remote1: string,
  remote2: string,
  remote3?: string,
  skipFirst = false
) {
  let invokedRemote1 = false;
  let invokedRemote2 = false;
  let invokedRemote3 = false;
  let invokedHost = false;
  let builtRemote1 = false;
  let builtRemote2 = false;
  let builtRemote3 = false;
  let builtHost = false;
  let showedAllRemotesInvokedInfo = false;

  let previewHostOptions = '';
  if (skipFirst) {
    previewHostOptions = `--skipRemotes=${remote1}`;
  }

  const p = await runCommandUntil(
    `run ${hostName}:preview ${previewHostOptions}`,
    (output) => {
      const includesBuiltMessage = (remote: string) => {
        // checking for the presence of ssr build output message to determine whether project has been built
        return stripConsoleColors(output).includes(
          `${remote.toUpperCase()} ../../dist/apps/${remote}/server/entry.preview.mjs`
        );
      };

      const includesInvokeMessage = (
        remote: string,
        port: number,
        includePrefix = true
      ) => {
        const prefix = includePrefix ? `${remote.toUpperCase()}   ➜  ` : '';
        const stripped = stripConsoleColors(output);
        // both resolved ip and "localhost" can be printed
        const ip = `${prefix}Local:   http://127.0.0.1:${port}/`;
        const localhost = `${prefix}Local:   http://localhost:${port}/`;
        return stripped.includes(ip) || stripped.includes(localhost);
      };

      // build output
      builtHost ||= stripConsoleColors(output).includes(
        `../../dist/apps/${hostName}/server/entry.preview.mjs`
      );
      builtRemote1 ||= includesBuiltMessage(remote1);
      builtRemote2 ||= includesBuiltMessage(remote2);
      builtRemote3 ||= !!remote3 && includesBuiltMessage(remote3);

      // serve output
      invokedHost ||= includesInvokeMessage(hostName, 4200, false);
      invokedRemote1 ||= includesInvokeMessage(remote1, 4201);
      invokedRemote2 ||= includesInvokeMessage(remote2, 4202);
      invokedRemote3 ||= !!remote3 && includesInvokeMessage(remote3, 4203);

      showedAllRemotesInvokedInfo ||= stripConsoleColors(
        output.replace(/\n|\s/g, '')
      ).includes(
        [
          'Preliminary actions completed',
          `Successfully instantiated "preview" targets of ${hostName}'s remotes.`,
          skipFirst ? `Skipped targets: ${remote1}` : null,
          `Starting the ${hostName}'s preview server..`,
        ]
          .filter(Boolean)
          .join('')
          .replace(/\n|\s/g, '')
      );

      return invokedHost;
    }
  );

  try {
    await promisifiedTreeKill(p.pid!, 'SIGKILL');
    await killPorts(...PORTS);
  } catch {
    // ignore
  }

  const hasBuildOutputs = (projectName: string): boolean => {
    try {
      checkFilesExist(`dist/apps/${projectName}/client/q-manifest.json`);
      checkFilesExist(`dist/apps/${projectName}/server/entry.preview.mjs`);
      return true;
    } catch {
      return false;
    }
  };

  return {
    invokedRemote1,
    invokedRemote2,
    invokedRemote3,
    showedAllRemotesInvokedInfo,
    invokedHost,
    builtRemote1: builtRemote1 && hasBuildOutputs(remote1),
    builtRemote2: builtRemote2 && hasBuildOutputs(remote2),
    builtRemote3: remote3 && builtRemote3 && hasBuildOutputs(remote3),
    builtHost: builtHost && hasBuildOutputs(hostName),
  };
}
