import { MicroFrontendsDevServerExecutorSchema } from './schema';
import executor from './executor';

const options: MicroFrontendsDevServerExecutorSchema = {};

describe('MicroFrontendsDevServer Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
  });
});
