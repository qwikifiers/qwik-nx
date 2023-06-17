import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { denoIntegrationGenerator } from './generator';
import { DenoIntegrationGeneratorSchema } from './schema';

describe('deno-integration generator', () => {
  let tree: Tree;
  const options: DenoIntegrationGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await denoIntegrationGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});
