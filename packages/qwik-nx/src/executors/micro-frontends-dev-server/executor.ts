import { viteDevServerExecutor } from '@nrwl/vite/executors';
import { ExecutorContext } from '@nrwl/devkit';
import { runRemotes } from '../utils/run-remotes';
import { MicroFrontendsDevServerExecutorSchema } from './schema';
import { addMicroFrontendBetaWarning } from '../../utils/mf-beta-warning';

export async function* microFrontendsDevServer(
  options: MicroFrontendsDevServerExecutorSchema,
  context: ExecutorContext
) {
  addMicroFrontendBetaWarning();
  await runRemotes(options, context);

  return yield* viteDevServerExecutor(options, context);
}

export default microFrontendsDevServer;
