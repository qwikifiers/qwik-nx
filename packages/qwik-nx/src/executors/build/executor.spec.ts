import { BuildExecutorSchema } from './schema';
import executor from './executor';
import {
  ExecutorContext,
  ProjectsConfigurations,
  runExecutor,
  Target,
} from '@nx/devkit';
import { resolve } from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const devkit: { runExecutor: typeof runExecutor } = require('@nx/devkit');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

enum MockFailTargets {
  NoSuccess = 'mock-no-success',
  Error = 'mock-error',
}

describe('Build Executor', () => {
  let runExecutorPayloads: Target[] = [];
  const defaultContext = {
    root: '/root',
    projectName: 'my-app',
    targetName: 'build',
    configurationName: 'production',
    projectsConfigurations: {
      projects: { 'my-app': { projectType: 'application', root: '/root' } },
    } as any as ProjectsConfigurations,
  } as ExecutorContext;

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
    const options: BuildExecutorSchema = {
      runSequence: ['my-app:target1:development', 'my-app:target2'],
      skipTypeCheck: true,
    };
    const iterable = executor(options, defaultContext);
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
    const target = MockFailTargets.NoSuccess;

    const options: BuildExecutorSchema = {
      runSequence: [
        'my-app:target1:development',
        `my-app:${target}`,
        'my-app:target2',
      ],
      skipTypeCheck: true,
    };
    const iterable = executor(options, defaultContext);
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
    const target = MockFailTargets.Error;

    const options: BuildExecutorSchema = {
      runSequence: [
        'my-app:target1:development',
        `my-app:${target}`,
        'my-app:target2',
      ],
      skipTypeCheck: true,
    };
    const iterable = executor(options, defaultContext);
    let result = await iterable.next();
    expect(result.value?.success).toEqual(false);
    expect(runExecutorPayloads).toEqual([
      { project: 'my-app', target: 'target1', configuration: 'development' },
      { project: 'my-app', target: target, configuration: 'production' },
    ]);
    result = await iterable.next();
    expect(result.done).toEqual(true);
  });

  describe('type check', () => {
    const defaultOptionsForTypeCheck: BuildExecutorSchema = {
      runSequence: ['my-app:target1:development', 'my-app:target2'],
    };

    it('should throw an error if tsconfig is not found at default location', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const iterable = executor(defaultOptionsForTypeCheck, defaultContext);
      await expect(iterable.next()).rejects.toThrow(
        `Could not find tsconfig at "${resolve(
          '/root/tsconfig.app.json'
        )}". If project's tsconfig file name is not standard, provide the path to it as "tsConfig" executor option.`
      );
    });
    it('should throw an error if tsconfig is not found at specified location', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const iterable = executor(
        {
          ...defaultOptionsForTypeCheck,
          tsConfig: '/root/tsconfig.other.json',
        },
        defaultContext
      );
      await expect(iterable.next()).rejects.toThrow(
        `Could not find tsconfig at "${resolve('/root/tsconfig.other.json')}".`
      );
    });
  });
});
