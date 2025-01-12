import { joinPathFragments, Tree } from '@nx/devkit';
import { QwikWorkspacePresetGeneratorSchema } from './schema';

export default async function (
  tree: Tree,
  options: QwikWorkspacePresetGeneratorSchema
) {
  const appGeneratorOptions = {
    directory: options.qwikAppName,
    style: options.qwikAppStyle,
    linter: options.linter,
    unitTestRunner: options.unitTestRunner,
    e2eTestRunner: options.e2eTestRunner,
  };
  if (options.qwikAppName.split('/').length === 1) {
    appGeneratorOptions.directory = joinPathFragments(
      'apps',
      options.qwikAppName
    );
  }
  return await import('../application/generator').then(({ appGenerator }) =>
    appGenerator(tree, appGeneratorOptions)
  );
}
