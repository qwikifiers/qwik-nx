import { Tree } from '@nrwl/devkit';
import { QwikWorkspacePresetGeneratorSchema } from './schema';
import applicationGenerator from '../application/generator';

export default async function (
  tree: Tree,
  options: QwikWorkspacePresetGeneratorSchema
) {
  options.directory = '';
  return applicationGenerator(tree, options);
}
