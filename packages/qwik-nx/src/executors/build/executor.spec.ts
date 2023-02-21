import { BuildExecutorSchema } from './schema';
import executor from './executor';
import { ExecutorContext, runExecutor, Target } from '@nrwl/devkit';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const devkit: { runExecutor: typeof runExecutor } = require('@nrwl/devkit');

enum MockFailTargets {
  NoSuccess = 'mock-no-success',
  Error = 'mock-error',
}

describe('Build Executor', () => {
  let runExecutorPayloads: Target[] = [];

  jest.spyOn(devkit, 'runExecutor').mockImplementation((target: Target) => {
    if (target.target === MockFailTargets.NoSuccess) {
      return Promise.resolve(
        (async function* () {
          runExecutorPayloads.push(target);
          yield { success: false, target }; // yielding target for debugging purposes
        })()
      );
    } else if (target.target === MockFailTargets.Error) {
      return Promise.resolve(
        // eslint-disable-next-line require-yield
        (async function* () {
          runExecutorPayloads.push(target);
          throw new Error('Something went wrong');
        })()
      );
    } else {
      return Promise.resolve(
        (async function* () {
          runExecutorPayloads.push(target);
          yield { success: true, target }; // yielding target for debugging purposes
        })()
      );
    }
  });

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
    let result = await iterable.next();
    expect(result.value?.success).toEqual(true);
    expect(runExecutorPayloads).toEqual([
      { project: 'my-app', target: 'target1', configuration: 'development' },
      { project: 'my-app', target: 'target2', configuration: 'production' },
    ]);
    result = await iterable.next();
    expect(result.done).toEqual(true);
  });

  it('should stop execution if executor returned "success: false"', async () => {
    const context = {
      root: '/root',
      projectName: 'my-app',
      targetName: 'build',
      configurationName: 'production',
    } as ExecutorContext;

    const target = MockFailTargets.NoSuccess;

    const options: BuildExecutorSchema = {
      runSequence: [
        'my-app:target1:development',
        `my-app:${target}`,
        'my-app:target2',
      ],
    };
    const iterable = executor(options, context);
    let result = await iterable.next();
    expect(result.value?.success).toEqual(false);
    expect(runExecutorPayloads).toEqual([
      { project: 'my-app', target: 'target1', configuration: 'development' },
      { project: 'my-app', target: target, configuration: 'production' },
    ]);
    result = await iterable.next();
    expect(result.done).toEqual(true);
  });

  it('should stop execution if unhandled error occurs', async () => {
    const context = {
      root: '/root',
      projectName: 'my-app',
      targetName: 'build',
      configurationName: 'production',
    } as ExecutorContext;

    const target = MockFailTargets.Error;

    const options: BuildExecutorSchema = {
      runSequence: [
        'my-app:target1:development',
        `my-app:${target}`,
        'my-app:target2',
      ],
    };
    const iterable = executor(options, context);
    let result = await iterable.next();
    expect(result.value?.success).toEqual(false);
    expect(runExecutorPayloads).toEqual([
      { project: 'my-app', target: 'target1', configuration: 'development' },
      { project: 'my-app', target: target, configuration: 'production' },
    ]);
    result = await iterable.next();
    expect(result.done).toEqual(true);
  });
});
