import { BuildExecutorSchema } from './schema';
import executor from './executor';
import { ExecutorContext, runExecutor, Target } from '@nrwl/devkit';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const devkit: { runExecutor: typeof runExecutor } = require('@nrwl/devkit');

describe('Build Executor', () => {
  let runExecutorPayloads: Target[] = [];

  jest.spyOn(devkit, 'runExecutor').mockImplementation((target: Target) =>
    Promise.resolve(
      (async function* () {
        runExecutorPayloads.push(target);
        yield { success: true, target }; // yielding target for debugging purposes
      })()
    )
  );

  afterEach(() => {
    runExecutorPayloads = [];
  });

  it('should execute targets sequentially', async () => {
    const context = {
      root: '/root',
      projectName: 'my-app',
      targetName: 'build',
      configurationName: 'production',
    } as ExecutorContext;

    const options: BuildExecutorSchema = {
      runSequence: ['my-app:target1:development', 'my-app:target2'],
    };
    const iterable = executor(options, context);
    await iterable.next();
    expect(runExecutorPayloads.map((p) => p.target)).toEqual(['target1']);
    await iterable.next();
    expect(runExecutorPayloads.map((p) => p.target)).toEqual([
      'target1',
      'target2',
    ]);
    const result = await iterable.next();
    expect(runExecutorPayloads).toEqual([
      { project: 'my-app', target: 'target1', configuration: 'development' },
      { project: 'my-app', target: 'target2', configuration: 'production' },
    ]);
    expect(result.done).toEqual(true);
  });
});
