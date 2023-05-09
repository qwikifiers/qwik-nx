import {
  extractLayoutDirectory,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  Tree,
} from '@nx/devkit';
import { Linter } from '@nx/linter';
import { LibraryGeneratorSchema, NormalizedSchema } from '../schema';

export function normalizeOptions(
  tree: Tree,
  schema: LibraryGeneratorSchema
): NormalizedSchema {
  const extracted = extractLayoutDirectory(schema.directory ?? '');

  const name = names(schema.name).fileName;

  const fullProjectDirectory = extracted.projectDirectory
    ? `${names(extracted.projectDirectory).fileName}/${name}`
    : name;
  const projectName = fullProjectDirectory.replace(new RegExp('/', 'g'), '-');

  const { libsDir: defaultLibsDir } = getWorkspaceLayout(tree);
  const libsDir = extracted.layoutDirectory ?? defaultLibsDir;

  const projectRoot = joinPathFragments(libsDir, fullProjectDirectory);
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
    projectDirectory: fullProjectDirectory,
    parsedTags,
    setupVitest: withDefaultValues.unitTestRunner === 'vitest',
    offsetFromRoot: offsetFromRoot(projectRoot),
  };
}
