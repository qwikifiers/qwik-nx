import {
  ExecutorContext,
  output,
  parseTargetString,
  runExecutor,
  targetToTargetString,
} from '@nx/devkit';
import { BuildExecutorSchema } from './schema';
import * as chalk from 'chalk';
import { spawn } from 'child_process';
import { resolve } from 'path';
import { existsSync } from 'fs';

export default async function* runBuildExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  const configs = options.runSequence.map((target) => {
    const cfg = parseTargetString(target, context.projectGraph!);
    cfg.configuration ??= context.configurationName;
    return cfg;
  });

  if (!options.skipTypeCheck) {
    await runTypeCheck(options, context);
  }

  output.log({
    title: `Building the ${context.projectName} project`,
    bodyLines: [
      '\nTargets to be executed:',
      ...configs.map((t) => chalk.dim(targetToTargetString(t))),
    ],
  });

  for (const target of configs) {
    try {
      const step = await runExecutor(target, {}, context);

      for await (const result of step) {
        if (!result.success) {
          yield { success: false };
          return;
        }
      }
    } catch (error) {
      console.error(error);
      yield { success: false };
      return;
    }
  }

  yield { success: true };
}

async function runTypeCheck(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  let tsFilePath = options.tsConfig && resolve(options.tsConfig);

  if (!tsFilePath) {
    const projectConfiguration =
      context.projectsConfigurations!.projects[context.projectName!];
    const tsFileName =
      projectConfiguration.projectType === 'application'
        ? 'tsconfig.app.json'
        : 'tsconfig.lib.json';
    tsFilePath = resolve(projectConfiguration.root, tsFileName);
  }
  if (!existsSync(tsFilePath)) {
    const customTsConfigMessage = options.tsConfig
      ? ''
      : ` If project's tsconfig file name is not standard, provide the path to it as "tsConfig" executor option.`;
    throw new Error(
      `Could not find tsconfig at "${tsFilePath}".` + customTsConfigMessage
    );
  }

  const typeCheckCommand = `npx tsc --incremental --noEmit --pretty -p ${tsFilePath}`;
  output.log({
    title: `Running type check for the "${context.projectName}"..`,
    bodyLines: [chalk.dim(typeCheckCommand)],
  });

  const exitCode = await spawnChecker(typeCheckCommand);
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

function spawnChecker(typeCheckCommand: string) {
  return new Promise<number>((r) => {
    const proc = spawn(typeCheckCommand, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
      // shell is necessary on windows to get the process to even start.
      // Command line args constructed by checkers therefore need to escape double quotes
      // to have them not striped out by cmd.exe. Using shell on all platforms lets us avoid
      // having to perform platform-specific logic around escaping quotes since all platform
      // shells will strip out unescaped double quotes. E.g. shell=false on linux only would
      // result in escaped quotes not being unescaped.
      shell: true,
    });

    proc.on('exit', (code) => {
      if (code !== null && code !== 0) {
        r(code);
      } else {
        r(0);
      }
    });
  });
}
