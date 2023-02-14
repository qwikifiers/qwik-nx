import { ExecutorContext } from '@nrwl/devkit';
import { vitePreviewServerExecutor } from '@nrwl/vite/executors';
import { runRemotes } from '../utils/run-remotes';
import { MicroFrontendsPreviewServerExecutorSchema } from './schema';

export async function* microFrontendsPreviewServer(
  options: MicroFrontendsPreviewServerExecutorSchema,
  context: ExecutorContext
) {
  await runRemotes({ skipRemotes: options.skipRemotes }, context);

  return yield* vitePreviewServerExecutor(options, context);
}

export default microFrontendsPreviewServer;
