import {
  ExecutorContext,
  output,
  parseTargetString,
  runExecutor,
  targetToTargetString,
} from '@nrwl/devkit';
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
    const step = await runExecutor(target, {}, context);

    for await (const result of step) {
      if (!result.success) {
        return result;
      }
      yield {
        success: true,
      };
    }
  }
}
