import {
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { HostGeneratorSchema } from './schema';
import { appGenerator } from './../application/generator';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import remoteGenerator from '../remote/generator';
import { normalizeOptions } from '../application/utils/normalize-options';
import { join } from 'path';
import { addMicroFrontendBetaWarning } from '../../utils/mf-beta-warning';
import { NormalizedSchema } from '../application/schema';

function addFiles(
  tree: Tree,
  schema: NormalizedSchema,
  remotes: { name: string; port: number }[]
) {
  // TODO: switch to empty preset once available
  tree.delete(
    joinPathFragments(schema.projectRoot, 'src/routes/flower/index.tsx')
  );
  tree.delete(
    joinPathFragments(schema.projectRoot, 'src/routes/flower/flower.css')
  );

  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    schema.projectRoot,
    {
      name: schema.projectName,
      remotes: remotes.map((r) => r.name),
    }
  );

  tree.write(
    join(schema.projectRoot, 'src/config/remotes.json'),
    JSON.stringify(
      Object.fromEntries(
        remotes.map((r) => [r.name, `http://localhost:${r.port}`])
      )
    )
  );

  const projectConfig = readProjectConfiguration(tree, schema.projectName);
  projectConfig.targets!['serve'].executor =
    'qwik-nx:micro-frontends-dev-server';
  projectConfig.targets!['preview'].executor =
    'qwik-nx:micro-frontends-preview-server';
  updateProjectConfiguration(tree, schema.projectName, projectConfig);
}

export async function hostGenerator(tree: Tree, options: HostGeneratorSchema) {
  addMicroFrontendBetaWarning();
  const tasks: GeneratorCallback[] = [];

  const normalizedSchema = normalizeOptions(tree, {
    ...options,
    devServerPort: options.port,
    previewServerPort: options.port,
  });

  const initTask = await appGenerator(tree, {
    ...normalizedSchema,
    skipFormat: true,
  });
  tasks.push(initTask);

  const remotesWithPorts: {
    name: string;
    port: number;
  }[] = [];

  if (options.remotes) {
    let port = normalizedSchema.devServerPort + 1;
    for (const remote of options.remotes) {
      remotesWithPorts.push({
        name: remote,
        port,
      });

      await remoteGenerator(tree, {
        ...options,
        name: remote,
        port,
        skipFormat: true,
      });
      port++;
    }
  }

  addFiles(tree, normalizedSchema, remotesWithPorts);

  if (!options.skipFormat) {
    await formatFiles(tree);
  }
  return runTasksInSerial(...tasks);
}

export default hostGenerator;
