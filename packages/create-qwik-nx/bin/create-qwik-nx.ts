import * as enquirer from 'enquirer';
import * as yargs from 'yargs';
import * as chalk from 'chalk';

import { CreateWorkspaceOptions, createWorkspace } from 'create-nx-workspace';
import { output } from 'create-nx-workspace/src/utils/output';
import { printNxCloudSuccessMessage } from 'create-nx-workspace/src/utils/nx/nx-cloud';
import {
  determineCI,
  determineDefaultBase,
  determineNxCloud,
  determinePackageManager,
} from 'create-nx-workspace/src/internal-utils/prompts';
import {
  withAllPrompts,
  withCI,
  withGitOptions,
  withNxCloud,
  withOptions,
  withPackageManager,
} from 'create-nx-workspace/src/internal-utils/yargs-options';

interface Arguments extends CreateWorkspaceOptions {
  /** Friendly name for the qwikAppName option */
  appName: string;
  /** Friendly name for the qwikAppStyle option */
  style: string;
  qwikAppName: string;
  qwikAppStyle: string;
  qwikNxVersion: string;
}

export const commandsObject: yargs.Argv<Arguments> = yargs
  .wrap(yargs.terminalWidth())
  .parserConfiguration({
    'strip-dashed': true,
    'dot-notation': true,
  })
  .command<Arguments>(
    // this is the default and only command
    '$0 [name] [options]',
    'Create a new Nx workspace',
    (yargs) =>
      withOptions(
        yargs
          .option('name', {
            describe: chalk.dim`Workspace name (e.g. org name)`,
            type: 'string',
          })
          .option('appName', {
            describe: chalk.dim`The name of the Qwik application `,
            type: 'string',
          })
          .option('interactive', {
            describe: chalk.dim`Enable interactive mode with presets`,
            type: 'boolean',
            default: true,
          })
          .option('style', {
            describe: chalk.dim`Style option to be used with your Qwik app.`,
            type: 'string',
          })
          .option('qwikNxVersion', {
            describe: chalk.dim`Version of the qwik-nx package to be used. Latest by default.`,
            type: 'string',
          }),
        withNxCloud,
        withCI,
        withAllPrompts,
        withPackageManager,
        withGitOptions
      ),

    async (argv: yargs.ArgumentsCamelCase<Arguments>) => {
      await main(argv).catch((error) => {
        const { version } = require('../package.json');
        output.error({
          title: `Something went wrong! v${version}`,
        });
        throw error;
      });
    },
    [normalizeArgsMiddleware as yargs.MiddlewareFunction<unknown>]
  )
  .help('help', chalk.dim`Show help`)
  .version(
    'version',
    chalk.dim`Show version`,
    require('../package.json').version
  ) as yargs.Argv<Arguments>;

async function main(parsedArgs: yargs.Arguments<Arguments>) {
  output.log({
    title: `Creating your workspace.`,
    bodyLines: [
      'To make sure the command works reliably in all environments, and that the preset is applied correctly,',
      `Nx will run "${parsedArgs.packageManager} install" several times. Please wait.`,
    ],
  });

  let presetName = 'qwik-nx';

  if (parsedArgs.qwikNxVersion) {
    presetName += `@${parsedArgs.qwikNxVersion}`;
  }
  const workspaceInfo = await createWorkspace<Arguments>(
    presetName,
    parsedArgs
  );

  if (parsedArgs.nxCloud && workspaceInfo.nxCloudInfo) {
    printNxCloudSuccessMessage(workspaceInfo.nxCloudInfo);
  }

  output.log({
    title: `Successfully initialized the qwik-nx repo`,
  });
}

async function normalizeArgsMiddleware(
  argv: yargs.Arguments<Arguments>
): Promise<void> {
  // "appName" and "style" args should be applied with prefix,
  // because this is what "qwik-nx:preset" generator expects in order to be compatible with "create-nx-workspace --preset=qwik-nx"
  argv.qwikAppName ??= argv.appName;
  argv.qwikAppStyle ??= argv.style;

  try {
    output.log({
      title:
        "Let's create a new workspace [https://nx.dev/getting-started/intro]",
    });

    const preset = 'qwik-nx';
    const name = await determineRepoName(argv);
    const qwikAppName = await determineAppName(argv);
    const qwikAppStyle = await determineStyle(argv);

    const packageManager = await determinePackageManager(argv);
    const defaultBase = await determineDefaultBase(argv);
    const nxCloud = await determineNxCloud(argv);
    const ci = await determineCI(argv, nxCloud);

    Object.assign(argv, {
      name,
      preset,
      qwikAppName,
      qwikAppStyle,
      nxCloud,
      packageManager,
      defaultBase,
      ci,
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

async function determineRepoName(
  parsedArgs: yargs.Arguments<Arguments>
): Promise<string> {
  const repoName: string = parsedArgs._[0]
    ? parsedArgs._[0].toString()
    : parsedArgs.name;

  if (repoName) {
    return Promise.resolve(repoName);
  }

  const a = await enquirer.prompt<{ RepoName: string }>([
    {
      name: 'RepoName',
      message: `Repository name                      `,
      type: 'input',
    },
  ]);
  if (!a.RepoName) {
    output.error({
      title: 'Invalid repository name',
      bodyLines: [`Repository name cannot be empty`],
    });
    process.exit(1);
  }
  return a.RepoName;
}

async function determineAppName(
  parsedArgs: yargs.Arguments<Arguments>
): Promise<string> {
  if (parsedArgs.qwikAppName) {
    return Promise.resolve(parsedArgs.qwikAppName);
  }

  return enquirer
    .prompt<{ AppName: string }>([
      {
        name: 'AppName',
        message: `Application name                     `,
        type: 'input',
      },
    ])
    .then((a) => {
      if (!a.AppName) {
        output.error({
          title: 'Invalid name',
          bodyLines: [`Name cannot be empty`],
        });
        process.exit(1);
      }
      return a.AppName;
    });
}

async function determineStyle(
  parsedArgs: yargs.Arguments<Arguments>
): Promise<string | null> {
  const choices = [
    {
      name: 'css',
      message: 'CSS',
    },
    {
      name: 'scss',
      message: 'SASS(.scss)       [ http://sass-lang.com   ]',
    },
    {
      name: 'styl',
      message: 'Stylus(.styl)     [ http://stylus-lang.com ]',
    },
    {
      name: 'less',
      message: 'LESS              [ http://lesscss.org     ]',
    },
  ];

  if (!parsedArgs.qwikAppStyle) {
    return enquirer
      .prompt<{ style: string }>([
        {
          name: 'style',
          message: `Default stylesheet format            `,
          initial: 'css' as any,
          type: 'autocomplete',
          choices: choices,
        },
      ])
      .then((a: { style: string }) => a.style);
  }

  const foundStyle = choices.find(
    (choice) => choice.name === parsedArgs.qwikAppStyle
  );

  if (foundStyle === undefined) {
    output.error({
      title: 'Invalid style',
      bodyLines: [
        `It must be one of the following:`,
        '',
        ...choices.map((choice) => choice.name),
      ],
    });

    process.exit(1);
  }

  return Promise.resolve(parsedArgs.qwikAppStyle);
}
