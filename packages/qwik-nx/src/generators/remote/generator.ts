import {
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  logger,
  readJson,
  readProjectConfiguration,
  Tree,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { addMicroFrontendBetaWarning } from '../../utils/mf-beta-warning';
import appGenerator from '../application/generator';
import {
  NormalizedSchema,
  QwikAppGeneratorSchema,
} from '../application/schema';
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

  updateFiles(tree, normalizedSchema);

  if (options.host) {
    updateHostWithRemoteConfig(tree, options.host, normalizedSchema);
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }
  return runTasksInSerial(...tasks);
}

export default remoteGenerator;

function updateHostWithRemoteConfig(
  tree: Tree,
  hostProjectName: string,
  schema: NormalizedSchema
) {
  const hostConfig = readProjectConfiguration(tree, hostProjectName);
  const remoteConfigPath = joinPathFragments(
    hostConfig.root,
    'src/config/remotes.json'
  );

  if (tree.exists(remoteConfigPath)) {
    const config = readJson(tree, remoteConfigPath);
    config[schema.projectName] = `http://localhost:${schema.devServerPort}`;

    tree.write(remoteConfigPath, JSON.stringify(config));
  } else {
    logger.warn(
      `Could not find remote config at ${remoteConfigPath}. Did you generate this project with "qwik-nx:host"?`
    );
  }
}

function updateFiles(tree: Tree, schema: NormalizedSchema) {
  // TODO: switch to empty preset once available
  tree.delete(joinPathFragments(schema.projectRoot, 'src/routes/flower'));
  tree.delete(
    joinPathFragments(schema.projectRoot, 'src/components/header/header.css')
  );
  tree.delete(
    joinPathFragments(schema.projectRoot, 'src/components/header/header.tsx')
  );
  tree.delete(
    joinPathFragments(schema.projectRoot, 'src/components/icons/qwik.tsx')
  );
  tree.delete(
    joinPathFragments(
      schema.projectRoot,
      'src/components/router-head/router-head.tsx'
    )
  );

  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    schema.projectRoot,
    {
      name: schema.projectName,
    }
  );
}
