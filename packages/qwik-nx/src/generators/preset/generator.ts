import { Tree } from '@nrwl/devkit';
import { QwikWorkspacePresetGeneratorSchema } from './schema';
import applicationGenerator from '../application/generator';

export default async function (
  tree: Tree,
  options: QwikWorkspacePresetGeneratorSchema
) {
  options.directory = '';
  options.name = options.qwikAppName ?? options.name;
  options.style = options.qwikAppStyle ?? options.style;
  return applicationGenerator(tree, options);
}
