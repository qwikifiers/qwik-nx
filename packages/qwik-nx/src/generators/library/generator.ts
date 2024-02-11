import { Tree } from '@nx/devkit';
import { LibraryGeneratorSchema } from './schema';
import { ensureNxDependencies } from '../../utils/ensure-nx-dependencies';

export async function libraryGenerator(
  tree: Tree,
  schema: LibraryGeneratorSchema
) {
  ensureNxDependencies();

  const { libraryGeneratorInternal } = await import('./generator-internal');
  return libraryGeneratorInternal(tree, schema);
}

export default libraryGenerator;
