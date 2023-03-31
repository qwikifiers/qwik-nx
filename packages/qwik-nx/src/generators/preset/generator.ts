import { Tree } from '@nrwl/devkit';
import { QwikWorkspacePresetGeneratorSchema } from './schema';
import { ensurePeerDependenciesInstalled } from '../../utils/get-installed-nx-version';

export default async function (
  tree: Tree,
  options: QwikWorkspacePresetGeneratorSchema
) {
  ensurePeerDependenciesInstalled(tree);

  options.directory = '';
  options.name = options.qwikAppName ?? options.name;
  options.style = options.qwikAppStyle ?? options.style;
  return await import('../application/generator').then(({ appGenerator }) =>
    appGenerator(tree, options)
  );
}
