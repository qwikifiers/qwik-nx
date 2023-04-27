import { Tree } from '@nx/devkit';
import { QwikWorkspacePresetGeneratorSchema } from './schema';

export default async function (
  tree: Tree,
  options: QwikWorkspacePresetGeneratorSchema
) {
  options.directory = '';
  options.name = options.qwikAppName ?? options.name;
  options.style = options.qwikAppStyle ?? options.style;
  return await import('../application/generator').then(({ appGenerator }) =>
    appGenerator(tree, options)
  );
}
