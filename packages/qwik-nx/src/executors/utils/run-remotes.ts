import { ExecutorContext, output } from '@nx/devkit';
import { exec } from 'child_process';
import { join, resolve } from 'path';
import * as chalk from 'chalk';

export interface RunRemotesOptions {
  skipRemotes?: string[];
  remoteConfigPath?: string;
}
const DEFAULT_REMOTES_CONFIG_PATH = 'src/config/remotes.json';

export async function runRemotes(
  options: RunRemotesOptions,
  context: ExecutorContext
) {
  const p = context.projectsConfigurations!.projects[context.projectName!];

  const configPath =
    options.remoteConfigPath ?? join(p.root, DEFAULT_REMOTES_CONFIG_PATH);
  const resolvedModuleFederationConfigPath = resolve(context.root, configPath);

  let moduleFederationConfig: Record<string, string>;
  try {
    moduleFederationConfig = require(resolvedModuleFederationConfigPath);
  } catch {
    throw new Error(`Could not load ${resolvedModuleFederationConfigPath}`);
  }

  const remotesToSkip = new Set(options.skipRemotes ?? []);
  const knownRemotes = Object.keys(moduleFederationConfig).filter(
    (r) => !remotesToSkip.has(r)
  );

  const remotePromises = knownRemotes.map(
    (remote, index) =>
      new Promise<void>((resolve) => {
        const command = `npx nx run ${remote}:${context.targetName}${
          context.configurationName ? `:${context.configurationName}` : ''
        }`;
        const child = exec(command);

        const processExitListener = () => child.kill();
        process.on('exit', processExitListener);
        process.on('SIGTERM', processExitListener);

        child.stdout!.on('data', (data: string) => {
          process.stdout.write(addColorAndPrefix(data, remote, index));
          // eslint-disable-next-line no-control-regex
          const raw = data.replace(/\u001b[^m]*?m/g, ''); // removing colors
          if (raw.includes('Network:')) {
            // TODO
            // The message "Network:  https://host:port" allows to determine when the remote is ready to be
            // consumed by the Host.
            resolve();
          }
        });
        child.stderr!.on('data', (err) => {
          process.stderr.write(addColorAndPrefix(err, remote, index));
        });
        child.on('exit', () => {
          resolve();
        });
      })
  );

  await Promise.all(remotePromises);
  const isDevServer =
    context.target!.executor === 'qwik-nx:micro-frontends-dev-server';

  let skippedRemoteMessage: string | null = null;
  if (options.skipRemotes?.length) {
    skippedRemoteMessage = `Skipped targets: ${options.skipRemotes.join(', ')}`;
  }

  output.success({
    title: 'Preliminary actions completed',
    bodyLines: [
      `Successfully instantiated "${context.targetName}" targets of ${context.projectName}'s remotes.`,
      skippedRemoteMessage,
      `Starting the ${context.projectName}'s ${
        isDevServer ? 'dev' : 'preview'
      } server..`,
    ].filter((v): v is string => !!v),
  });
}

function addColorAndPrefix(out: string, remoteName: string, index: number) {
  const availableBgColors: typeof chalk.BackgroundColor[] = [
    'bgBlack',
    'bgRed',
    'bgGreen',
    'bgYellow',
    'bgBlue',
    'bgMagenta',
    'bgCyan',
    'bgWhite',
  ];
  const availableColors: typeof chalk.ForegroundColor[] = [
    'black',
    'red',
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'white',
  ];
  out = out
    .split('\n')
    .map((l) =>
      l.trim().length > 0 ? `${chalk.bold(remoteName.toUpperCase())} ${l}` : l
    )
    .join('\n');
  if (index < availableColors.length) {
    out = chalk[availableColors[index]](out);
  } else {
    out = chalk[availableBgColors[index % availableBgColors.length]](out);
  }
  return out;
}
