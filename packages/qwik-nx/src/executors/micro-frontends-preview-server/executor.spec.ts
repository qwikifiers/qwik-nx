import { MicroFrontendsPreviewServerExecutorSchema } from './schema';
import executor from './executor';

const options: MicroFrontendsPreviewServerExecutorSchema = {};

describe('MicroFrontendsPreviewServer Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
  });
});
