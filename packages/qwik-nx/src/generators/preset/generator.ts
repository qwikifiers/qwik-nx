import { joinPathFragments, Tree } from '@nx/devkit';
import { QwikWorkspacePresetGeneratorSchema } from './schema';

export default async function (
  tree: Tree,
  options: QwikWorkspacePresetGeneratorSchema
) {
  if (options.qwikAppName.split('/').length === 1) {
    options.directory = joinPathFragments('apps', options.qwikAppName);
  } else {
    options.directory = options.qwikAppName;
  }
  options.style = options.qwikAppStyle ?? options.style;
  return await import('../application/generator').then(({ appGenerator }) =>
    appGenerator(tree, options)
  );
}
