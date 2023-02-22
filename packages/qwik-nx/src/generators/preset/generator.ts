import { ensurePackage, Tree } from '@nrwl/devkit';
import { QwikWorkspacePresetGeneratorSchema } from './schema';
import { appGenerator } from '../application/generator';
import { getInstalledNxVersion } from '../../utils/get-installed-nx-version';

export default async function (
  tree: Tree,
  options: QwikWorkspacePresetGeneratorSchema
) {
  await ensurePackage(tree, '@nrwl/vite', getInstalledNxVersion(tree));

  options.directory = '';
  options.name = options.qwikAppName ?? options.name;
  options.style = options.qwikAppStyle ?? options.style;
  return appGenerator(tree, options);
}
