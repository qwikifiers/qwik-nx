import {
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  Tree,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { addMicroFrontendBetaWarning } from '../../utils/mf-beta-warning';
import appGenerator from '../application/generator';
import { QwikAppGeneratorSchema } from '../application/schema';
import { normalizeOptions } from '../application/utils/normalize-options';
import { RemoteGeneratorSchema } from './schema';

export async function remoteGenerator(
  tree: Tree,
  options: RemoteGeneratorSchema
) {
  addMicroFrontendBetaWarning();
  const tasks: GeneratorCallback[] = [];

  const appGeneratorSchema: QwikAppGeneratorSchema = {
    ...options,
    devServerPort: options.port,
    previewServerPort: options.port,
    skipFormat: true,
  };
  const initTask = await appGenerator(tree, appGeneratorSchema);
  tasks.push(initTask);

  const normalizedSchema = normalizeOptions(tree, appGeneratorSchema);
  // TODO: switch to empty preset once available
  tree.delete(
    joinPathFragments(normalizedSchema.projectRoot, 'src/routes/flower')
  );
  tree.delete(
    joinPathFragments(
      normalizedSchema.projectRoot,
      'src/components/header/header.css'
    )
  );
  tree.delete(
    joinPathFragments(
      normalizedSchema.projectRoot,
      'src/components/header/header.tsx'
    )
  );
  tree.delete(
    joinPathFragments(
      normalizedSchema.projectRoot,
      'src/components/icons/qwik.tsx'
    )
  );
  tree.delete(
    joinPathFragments(
      normalizedSchema.projectRoot,
      'src/components/router-head/router-head.tsx'
    )
  );

  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    normalizedSchema.projectRoot,
    {
      name: normalizedSchema.projectName,
    }
  );

  if (!options.skipFormat) {
    await formatFiles(tree);
  }
  return runTasksInSerial(...tasks);
}

export default remoteGenerator;
