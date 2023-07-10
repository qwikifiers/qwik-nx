import { execSync } from 'node:child_process';
import { ExecExecutorSchema } from './schema';
import { ExecutorContext } from '@nx/devkit';
import { isAbsolute, join } from 'path';

const LARGE_BUFFER = 1024 * 1000000;

function calculateCwd(
  cwd: string | undefined,
  context: ExecutorContext
): string {
  if (!cwd) return context.root;
  if (isAbsolute(cwd)) return cwd;
  return join(context.root, cwd);
}

export default async function runExecutor(
  options: ExecExecutorSchema,
  context: ExecutorContext
) {
  let success = false;
  try {
    execSync(options.command, {
      stdio: [0, 1, 2],
      cwd: calculateCwd(options.cwd, context),
      maxBuffer: LARGE_BUFFER,
    });
    success = true;
  } catch {
    success = false;
  }
  return {
    success,
  };
}
