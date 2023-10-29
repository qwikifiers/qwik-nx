import { offsetFromRoot, Tree } from '@nx/devkit';
import { Linter } from '@nx/linter';
import { LibraryGeneratorSchema, NormalizedSchema } from '../schema';
import { determineProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils';

export async function normalizeOptions(
  tree: Tree,
  schema: LibraryGeneratorSchema
): Promise<NormalizedSchema> {
  const { projectName, projectRoot, projectNameAndRootFormat } =
    await determineProjectNameAndRootOptions(tree, {
      name: schema.name,
      projectType: 'library',
      callingGenerator: 'qwik-nx:library',
      directory: schema.directory,
      projectNameAndRootFormat: schema.projectNameAndRootFormat,
    });

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
    projectName,
    projectRoot,
    parsedTags,
    projectNameAndRootFormat,
    setupVitest: withDefaultValues.unitTestRunner === 'vitest',
    offsetFromRoot: offsetFromRoot(projectRoot),
  };
}
