// source: https://github.com/nrwl/nx/blob/master/e2e/utils/index.ts

import { runNxCommandAsync, uniq, tmpProjPath } from '@nrwl/nx-plugin/testing';
import { ChildProcess, exec, execSync } from 'child_process';
import { readdirSync, readFileSync, removeSync, statSync } from 'fs-extra';
import { check as portCheck } from 'tcp-port-used';
import { promisify } from 'util';
import * as chalk from 'chalk';
import * as treeKill from 'tree-kill';
import {
  detectPackageManager,
  getPackageManagerCommand,
} from 'nx/src/utils/package-manager';

const kill = require('kill-port');
export const isWindows = require('is-windows');

export const promisifiedTreeKill: (
  pid: number,
  signal: string
) => Promise<void> = promisify(treeKill);

function getAdditionalPackageManagerCommands(): {
  createWorkspace: string;
  runNx: string;
} {
  const pm = detectPackageManager();
  const [npmMajorVersion] = execSync(`npm -v`).toString().split('.');
  const publishedVersion = execSync('npm view nx version');
  switch (pm) {
    case 'npm':
      return {
        createWorkspace: `npx ${
          +npmMajorVersion >= 7 ? '--yes' : ''
        } create-nx-workspace@${publishedVersion}`,
        runNx: `npx nx`,
      };
    case 'yarn':
      return {
        createWorkspace: `yarn global add create-nx-workspace@${publishedVersion} && create-nx-workspace`,
        runNx: `yarn nx`,
      };
    case 'pnpm':
      return {
        createWorkspace: `pnpm dlx create-nx-workspace@${publishedVersion}`,
        runNx: `pnpm exec nx`,
      };
  }
}

export function runCreateWorkspace(
  name: string,
  {
    preset,
    appName,
    style,
    base,
    packageManager,
    extraArgs,
    ci,
    useDetectedPm = false,
    bundler,
  }: {
    preset: string;
    appName?: string;
    style?: string;
    base?: string;
    packageManager?: 'npm' | 'yarn' | 'pnpm';
    extraArgs?: string;
    ci?: 'azure' | 'github' | 'circleci';
    useDetectedPm?: boolean;
    bundler?: 'webpack' | 'vite';
  }
) {
  const pm = getPackageManagerCommand();

  let command = `${getAdditionalPackageManagerCommands()} ${name} --preset=${preset} --no-nxCloud --no-interactive`;
  if (appName) {
    command += ` --appName=${appName}`;
  }
  if (style) {
    command += ` --style=${style}`;
  }
  if (ci) {
    command += ` --ci=${ci}`;
  }

  if (bundler) {
    command += ` --bundler=${bundler}`;
  }

  if (base) {
    command += ` --defaultBase="${base}"`;
  }

  if (packageManager && !useDetectedPm) {
    command += ` --package-manager=${packageManager}`;
  }

  if (extraArgs) {
    command += ` ${extraArgs}`;
  }

  const create = execSync(command, {
    cwd: tmpProjPath(),
    stdio: isVerbose() ? 'inherit' : 'pipe',
    env: { CI: 'true', ...process.env },
    encoding: 'utf-8',
  });
  return create ? create.toString() : '';
}

const KILL_PORT_DELAY = 5000;

export async function killPort(port: number): Promise<boolean> {
  if (await portCheck(port)) {
    try {
      logInfo(`Attempting to close port ${port}`);
      await kill(port);
      await new Promise<void>((resolve) =>
        setTimeout(() => resolve(), KILL_PORT_DELAY)
      );
      if (await portCheck(port)) {
        logError(`Port ${port} still open`);
      } else {
        logSuccess(`Port ${port} successfully closed`);
        return true;
      }
    } catch {
      logError(`Port ${port} closing failed`);
    }
    return false;
  } else {
    return true;
  }
}

export function runCommandUntil(
  command: string,
  criteria: (output: string) => boolean
): Promise<ChildProcess> {
  const pm = getAdditionalPackageManagerCommands();
  const p = exec(`${pm.runNx} ${command}`, {
    cwd: tmpProjPath(),
    encoding: 'utf-8',
    env: {
      CI: 'true',
      ...getEnvironmentVariables(),
      FORCE_COLOR: 'false',
    },
  });
  return new Promise((res, rej) => {
    let output = '';
    let complete = false;

    function checkCriteria(c: any) {
      output += c.toString();
      if (criteria(stripConsoleColors(output)) && !complete) {
        complete = true;
        res(p);
      }
    }

    p.stdout?.on('data', checkCriteria);
    p.stderr?.on('data', checkCriteria);
    p.on('exit', (code) => {
      if (!complete) {
        rej(`Exited with ${code}`);
      } else {
        res(p);
      }
    });
  });
}

export function getEnvironmentVariables() {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([key, value]) => !key.startsWith('NX_') || key.startsWith('NX_E2E_')
    )
  );
}

/**
 * Remove log colors for fail proof string search
 * @param log
 * @returns
 */
export function stripConsoleColors(log: string): string {
  return log.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  );
}

export function expectTestsPass(v: { stdout: string; stderr: string }) {
  expect(v.stderr).toContain('Ran all test suites');
  expect(v.stderr).not.toContain('fail');
}

export function checkFilesDoNotExist(...expectedFiles: string[]) {
  expectedFiles.forEach((f) => {
    const ff = f.startsWith('/') ? f : tmpProjPath(f);
    if (exists(ff)) {
      throw new Error(`File '${ff}' should not exist`);
    }
  });
}

export function listFiles(dirName: string) {
  return readdirSync(tmpProjPath(dirName));
}

export function readFile(f: string) {
  const ff = f.startsWith('/') ? f : tmpProjPath(f);
  return readFileSync(ff, 'utf-8');
}

export function removeFile(f: string) {
  const ff = f.startsWith('/') ? f : tmpProjPath(f);
  removeSync(ff);
}

export function rmDist() {
  removeSync(`${tmpProjPath()}/dist`);
}

export function directoryExists(filePath: string): boolean {
  try {
    return statSync(filePath).isDirectory();
  } catch (err) {
    return false;
  }
}

export function fileExists(filePath: string): boolean {
  try {
    return statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

export function exists(filePath: string): boolean {
  return directoryExists(filePath) || fileExists(filePath);
}

export function waitUntil(
  predicate: () => boolean,
  opts: { timeout: number; ms: number; allowError?: boolean } = {
    timeout: 5000,
    ms: 50,
  }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setInterval(() => {
      const run = () => {};
      try {
        run();
        if (predicate()) {
          clearInterval(t);
          resolve();
        }
      } catch (e) {
        if (opts.allowError) reject(e);
      }
    }, opts.ms);

    setTimeout(() => {
      clearInterval(t);
      reject(new Error(`Timed out waiting for condition to return true`));
    }, opts.timeout);
  });
}

/**
 * Runs the pass in generator and then runs test on
 * the generated project to make sure the default tests pass.
 */
export async function expectJestTestsToPass(generator: string) {
  const name = uniq('proj');
  const generatedResults = await runNxCommandAsync(
    `generate ${generator} ${name} --no-interactive`
  );
  expect(generatedResults).toContain(`jest.config.ts`);

  const results = await runNxCommandAsync(`test ${name}`);
  expect(results.stdout).toContain('Test Suites: 1 passed, 1 total');
}

const E2E_LOG_PREFIX = `${chalk.reset.inverse.bold.keyword('orange')(' E2E ')}`;

function e2eConsoleLogger(message: string, body?: string) {
  process.stdout.write('\n');
  process.stdout.write(`${E2E_LOG_PREFIX} ${message}\n`);
  if (body) {
    process.stdout.write(`${body}\n`);
  }
  process.stdout.write('\n');
}

export function logInfo(title: string, body?: string) {
  const message = `${chalk.reset.inverse.bold.white(
    ' INFO '
  )} ${chalk.bold.white(title)}`;
  return e2eConsoleLogger(message, body);
}

export function logError(title: string, body?: string) {
  const message = `${chalk.reset.inverse.bold.red(' ERROR ')} ${chalk.bold.red(
    title
  )}`;
  return e2eConsoleLogger(message, body);
}

export function logSuccess(title: string, body?: string) {
  const message = `${chalk.reset.inverse.bold.green(
    ' SUCCESS '
  )} ${chalk.bold.green(title)}`;
  return e2eConsoleLogger(message, body);
}

export function isVerbose() {
  return process.argv.includes('--verbose');
}
