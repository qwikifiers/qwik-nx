import {
  ExecutorContext,
  output,
  parseTargetString,
  runExecutor,
  targetToTargetString,
} from '@nx/devkit';
import { BuildExecutorSchema } from './schema';
import * as chalk from 'chalk';

export default async function* runBuildExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  const configs = options.runSequence.map((target) => {
    const cfg = parseTargetString(target, context.projectGraph!);
    cfg.configuration ??= context.configurationName;
    return cfg;
  });

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
