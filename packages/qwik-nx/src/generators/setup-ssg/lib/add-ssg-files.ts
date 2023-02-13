import { generateFiles, offsetFromRoot, Tree } from '@nrwl/devkit';
import * as path from 'path';
import { NormalizedSchema } from '../schema';

export function addSsgFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(
    tree,
    path.join(__dirname, '..', 'files'),
    options.projectRoot,
    templateOptions
  );
}
