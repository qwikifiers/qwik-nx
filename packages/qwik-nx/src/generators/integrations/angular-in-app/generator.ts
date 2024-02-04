import { Tree } from '@nx/devkit';
import { AngularInAppGeneratorSchema } from './schema';
import { ensureNxDependencies } from './../../../utils/ensure-nx-dependencies';

export async function angularInAppGenerator(
  tree: Tree,
  schema: AngularInAppGeneratorSchema
) {
  ensureNxDependencies();

  const { angularInAppGeneratorInternal } = await import(
    './generator-internal'
  );
  return angularInAppGeneratorInternal(tree, schema);
}

export default angularInAppGenerator;
