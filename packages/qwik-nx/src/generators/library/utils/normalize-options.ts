import { offsetFromRoot, Tree } from '@nx/devkit';
import { Linter } from '@nx/eslint';
import { LibraryGeneratorSchema, NormalizedSchema } from '../schema';
import {
  determineProjectNameAndRootOptions,
  ensureProjectName,
} from '@nx/devkit/src/generators/project-name-and-root-utils';

export async function normalizeOptions(
  tree: Tree,
  schema: LibraryGeneratorSchema
): Promise<NormalizedSchema> {
  await ensureProjectName(tree, schema, 'library');

  const { projectName, projectRoot } = await determineProjectNameAndRootOptions(
    tree,
    {
      name: schema.name,
      projectType: 'library',
      directory: schema.directory,
    }
  );

  const parsedTags = schema.tags
    ? schema.tags.split(',').map((s) => s.trim())
    : [];

  const withDefaultValues = {
    ...schema,
    style: schema.style ?? 'css',
    unitTestRunner: schema.unitTestRunner ?? 'vitest',
    linter: schema.linter ?? Linter.EsLint,
    buildable: !!schema.buildable,
    storybookConfiguration: !!schema.storybookConfiguration,
    generateComponent: schema.generateComponent !== false,
  };

  return {
    ...withDefaultValues,
    name: schema.name!, // defined by the "ensureProjectName"
    projectName,
    projectRoot,
    parsedTags,
    setupVitest: withDefaultValues.unitTestRunner === 'vitest',
    offsetFromRoot: offsetFromRoot(projectRoot),
  };
}
