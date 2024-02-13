import { Tree } from '@nx/devkit';
import { ReactInAppGeneratorSchema } from './schema';
import { ensureNxDependencies } from '../../../utils/ensure-nx-dependencies';

export async function reactInAppGenerator(
  tree: Tree,
  schema: ReactInAppGeneratorSchema
) {
  ensureNxDependencies();

  const { reactInAppGeneratorInternal } = await import('./generator-internal');
  return reactInAppGeneratorInternal(tree, schema);
}

export default reactInAppGenerator;
