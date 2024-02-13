import { GeneratorCallback, Tree } from '@nx/devkit';
import { QwikAppGeneratorSchema } from './schema';
import { ensureNxDependencies } from '../../utils/ensure-nx-dependencies';

export async function appGenerator(
  tree: Tree,
  options: QwikAppGeneratorSchema
): Promise<GeneratorCallback> {
  ensureNxDependencies();

  const { appGeneratorInternal } = await import('./generator-internal');
  return appGeneratorInternal(tree, options);
}

export default appGenerator;
