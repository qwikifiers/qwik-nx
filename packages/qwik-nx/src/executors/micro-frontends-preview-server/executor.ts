import { ExecutorContext } from '@nx/devkit';
import { vitePreviewServerExecutor } from '@nx/vite/executors';
import { addMicroFrontendBetaWarning } from '../../utils/mf-beta-warning';
import { runRemotes } from '../utils/run-remotes';
import { MicroFrontendsPreviewServerExecutorSchema } from './schema';

export async function* microFrontendsPreviewServer(
  options: MicroFrontendsPreviewServerExecutorSchema,
  context: ExecutorContext
) {
  addMicroFrontendBetaWarning();
  await runRemotes(options, context);

  return yield* vitePreviewServerExecutor(options, context);
}

export default microFrontendsPreviewServer;
