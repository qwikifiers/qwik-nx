import { formatFiles, Tree, runTasksInSerial } from '@nx/devkit';
import { InitGeneratorSchema } from './schema';
import { addCommonQwikDependencies } from '../../utils/add-common-qwik-dependencies';
import { ensureNxDependencies } from '../../utils/ensure-nx-dependencies';

function updateDependencies(tree: Tree) {
  ensureNxDependencies();
  return addCommonQwikDependencies(tree);
}

export async function qwikInitGenerator(
  tree: Tree,
  options: InitGeneratorSchema
) {
  const installTask = updateDependencies(tree);

  if (!options.skipFormat) {
    await formatFiles(tree);
  }
  return runTasksInSerial(installTask);
}

export default qwikInitGenerator;
