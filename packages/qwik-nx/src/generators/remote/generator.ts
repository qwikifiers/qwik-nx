import {
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  Tree,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import appGenerator from '../application/generator';
import { QwikAppGeneratorSchema } from '../application/schema';
import { normalizeOptions } from '../application/utils/normalize-options';
import { RemoteGeneratorSchema } from './schema';

export async function remoteGenerator(
  tree: Tree,
  options: RemoteGeneratorSchema
) {
  const tasks: GeneratorCallback[] = [];

  const appGeneratorSchema: QwikAppGeneratorSchema = {
    ...options,
    devServerPort: options.port,
    previewServerPort: options.port,
    skipFormat: true,
  };
  const initTask = await appGenerator(tree, appGeneratorSchema);
  tasks.push(initTask);

  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    normalizeOptions(tree, appGeneratorSchema).projectRoot,
    {}
  );

  if (!options.skipFormat) {
    formatFiles(tree);
  }
  return runTasksInSerial(...tasks);
}

export default remoteGenerator;
