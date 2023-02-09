// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { viteDevServerExecutor } from '@nrwl/vite/executors';
import { ExecutorContext } from '@nrwl/devkit';
import { runRemotes } from '../utils/run-remotes';
import { MicroFrontendsDevServerExecutorSchema } from './schema';

export async function* microFrontendsDevServer(
  options: MicroFrontendsDevServerExecutorSchema,
  context: ExecutorContext
) {
  await runRemotes(options, context);

  return yield* viteDevServerExecutor(options, context);
}

export default microFrontendsDevServer;
