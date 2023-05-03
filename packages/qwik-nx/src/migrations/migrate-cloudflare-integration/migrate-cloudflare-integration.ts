import {
  ProjectConfiguration,
  ensurePackage,
  getProjects,
  joinPathFragments,
  Tree,
} from '@nx/devkit';
import {
  hasCloudflareIntegration,
  isQwikNxProject,
} from '../../utils/migrations';
import { tsMorphVersion } from '../../utils/versions';

export default async function update(tree: Tree) {
  const projects = getProjects(tree);

  for (const [, config] of projects) {
    if (isQwikNxProject(config) && hasCloudflareIntegration(tree, config)) {
      // functions are no longer needed
      tree.delete(joinPathFragments(config.root, 'functions/[[path]].ts'));
      await updateCloudflarePagesEntry(tree, config);
    }
  }
}

async function updateCloudflarePagesEntry(
  tree: Tree,
  config: ProjectConfiguration
) {
  ensurePackage('ts-morph', tsMorphVersion);
  const tsMorph = await import('ts-morph');
  const filePath = joinPathFragments(
    config.root,
    'src/entry.cloudflare-pages.tsx'
  );
  const fileContent = tree.read(filePath)?.toString();
  if (!fileContent) {
    return;
  }
  const project = new tsMorph.Project();
  const sourceFile = project.createSourceFile('temp.ts', fileContent);

  sourceFile.getVariableDeclaration('onRequest')?.rename('fetch');

  [...sourceFile.getExportDeclarations()]
    .map((e) => e.getNamedExports())
    .flat()
    .find((n) => n.getName() === 'onRequest')
    ?.setName('fetch');

  tree.write(filePath, sourceFile.getFullText());
}
