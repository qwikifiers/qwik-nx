import { getWorkspaceLayout, names, offsetFromRoot, Tree } from '@nrwl/devkit';
import { Linter } from '@nrwl/linter';
import { LibraryGeneratorSchema, NormalizedSchema } from '../schema';

export function normalizeOptions(
  tree: Tree,
  schema: LibraryGeneratorSchema
): NormalizedSchema {
  const name = names(schema.name).fileName;
  const projectDirectory = schema.directory
    ? `${names(schema.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;
  const parsedTags = schema.tags
    ? schema.tags.split(',').map((s) => s.trim())
    : [];

  const withDefaultValues = {
    ...schema,
    style: schema.style ?? 'css',
    unitTestRunner: schema.unitTestRunner ?? 'vitest',
    linter: schema.linter ?? Linter.EsLint,
    buildable: !!schema.buildable,
  };

  return {
    ...withDefaultValues,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    setupVitest: withDefaultValues.unitTestRunner === 'vitest',
    offsetFromRoot: offsetFromRoot(projectRoot),
  };
}
