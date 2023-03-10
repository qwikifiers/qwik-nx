import {
  ensurePackage,
  getProjects,
  Tree,
  visitNotIgnoredFiles,
} from '@nrwl/devkit';
import { extname } from 'path';
import { SyntaxKind } from 'typescript';

export default async function update(tree: Tree) {
  ensurePackage('ts-morph', '^17.0.0');
  const tsMorph = await import('ts-morph');
  for (const [, definition] of getProjects(tree)) {
    visitNotIgnoredFiles(tree, definition.root, (file) => {
      if (extname(file) === '.tsx') {
        updateNamedImport(
          tree,
          tsMorph,
          file,
          '@builder.io/qwik',
          'useClientEffect$',
          'useVisibleTask$'
        );
      }
    });
  }
}

function updateNamedImport(
  tree: Tree,
  tsMorph: typeof import('ts-morph'),
  filePath: string,
  importModuleSpecifier: string,
  importName: string,
  updatedImportName: string
) {
  const fileContent = tree.read(filePath)!.toString();
  const project = new tsMorph.Project();
  const sourceFile = project.createSourceFile('temp.ts', fileContent);
  const imports = sourceFile.getImportDeclarations();
  const relevantImports = imports
    .map((imp) => {
      const moduleSpecifier = imp.getModuleSpecifierValue();
      if (moduleSpecifier !== importModuleSpecifier) {
        return [];
      }
      return imp
        .getNamedImports()
        .filter((namedImport) => namedImport.getName() === importName);
    })
    .filter((imports) => imports.length)
    .flat();

  if (relevantImports.length > 0) {
    relevantImports.forEach((imp) => imp.replaceWithText(updatedImportName));

    sourceFile.forEachDescendant((node) => {
      if (
        node.getKind() === SyntaxKind.Identifier &&
        node.getText() === importName &&
        [SyntaxKind.CallExpression, SyntaxKind.VariableDeclaration].includes(
          node.getParent()?.getKind() as SyntaxKind
        )
      ) {
        node.replaceWithText(updatedImportName);
      }
    });

    tree.write(filePath, sourceFile.getFullText());
  }

  return tree;
}
