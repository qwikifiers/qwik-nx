import {
  GeneratorCallback,
  Tree,
  addDependenciesToPackageJson,
  generateFiles,
  joinPathFragments,
  output,
  readJson,
  writeJson,
} from '@nx/devkit';
import path = require('path');
import {
  angularVersion,
  qwikAngularVersion,
  vitePluginAngularVersion,
} from '../versions';
import { updateViteConfig } from '../update-vite-config';
import { normalizeViteConfigFilePathWithTree } from '@nx/vite';

export interface AngularInitSchema {
  demoFilePath: string;
  installMaterialExample: boolean;
  projectRoot: string;
  isApp: boolean;
}

function addFiles(tree: Tree, options: AngularInitSchema) {
  generateFiles(
    tree,
    path.join(
      __dirname,
      'files',
      options.installMaterialExample ? 'material/integration-files' : 'demo'
    ),
    options.demoFilePath,
    {}
  );

  if (options.installMaterialExample && options.isApp) {
    const added = addRootStyles(tree, options);
    if (added) {
      generateFiles(
        tree,
        path.join(__dirname, 'files/material/styles'),
        joinPathFragments(options.projectRoot, 'src'),
        {}
      );
    } else {
      output.warn({
        title: 'Failed to add material theme',
        bodyLines: [
          "Your integration is still functional, however you'll need to add Angular Material theme manually",
          // TODO: link to the docs
        ],
      });
    }
  }
}

function addRootStyles(tree: Tree, options: AngularInitSchema): boolean {
  const rootTsxPath = joinPathFragments(options.projectRoot, 'src/root.tsx');
  const importStatement = `import './theme.scss';`;

  if (tree.exists(rootTsxPath)) {
    let rootTsxContent = tree.read(rootTsxPath, 'utf-8')!;
    const indexToInsert = rootTsxContent.indexOf(`import './global.css';`);
    if (indexToInsert !== -1) {
      const before = rootTsxContent.slice(0, indexToInsert);
      const after = rootTsxContent.slice(indexToInsert);
      rootTsxContent = `${before}${importStatement}\n${after}`;
    } else {
      rootTsxContent = `${importStatement}\n${rootTsxContent}`;
    }
    tree.write(rootTsxPath, rootTsxContent);
    return true;
  }

  return false;
}

function addDependencies(
  tree: Tree,
  installMaterial: boolean
): GeneratorCallback {
  const devDependencies = {
    '@angular/cdk': angularVersion,
    '@angular/common': angularVersion,
    '@analogjs/vite-plugin-angular': vitePluginAngularVersion,
    '@qwikdev/qwik-angular': qwikAngularVersion,
    '@angular-devkit/build-angular': angularVersion,
    '@angular/compiler': angularVersion,
    '@angular/compiler-cli': angularVersion,
    '@angular/core': angularVersion,
    '@angular/forms': angularVersion,
    '@angular/platform-browser-dynamic': angularVersion,
    '@angular/platform-browser': angularVersion,
    '@angular/platform-server': angularVersion,
    '@ngtools/webpack': angularVersion,
  };
  if (installMaterial) {
    Object.assign(devDependencies, {
      '@angular/material': angularVersion,
    });
  }
  return addDependenciesToPackageJson(tree, {}, devDependencies);
}

export function addAngularPluginToViteConfig(
  tree: Tree,
  options: AngularInitSchema
) {
  const viteConfigPath = normalizeViteConfigFilePathWithTree(
    tree,
    options.projectRoot
  );

  if (!viteConfigPath) {
    throw new Error(`Could not resolve vite config at ${options.projectRoot}`);
  }
  const viteConfig = tree.read(viteConfigPath)!.toString();
  const bundleSassFilesInDevMode = `bundleSassFilesInDevMode: {
    paths: ["src/theme.scss"],
    compileOptions: { loadPaths: ["node_modules"] },
  }`;
  const updatedViteConfig = updateViteConfig(viteConfig, {
    imports: [
      {
        namedImports: ['angular'],
        importPath: '@qwikdev/qwik-angular/vite',
      },
    ],
    vitePlugins: [
      `angular({
      tsconfig: "${
        getAppTsConfigFileName(tree, options) ??
        '<INSERT VALID PATH TO TSCONFIG HERE>'
      }",
      componentsDir: "integrations/angular/components",
      ${options.installMaterialExample ? bundleSassFilesInDevMode : ''}
    })`,
    ],
  });
  tree.write(viteConfigPath, updatedViteConfig);
}

function getAppTsConfigFileName(
  tree: Tree,
  options: AngularInitSchema
): string | null {
  for (const tsConfigName of ['tsconfig.app.json', 'tsconfig.json']) {
    const tsConfigPath = joinPathFragments(options.projectRoot, tsConfigName);
    if (tree.exists(tsConfigPath)) {
      return tsConfigName;
    }
  }

  output.warn({
    title: `Could not resolve tsconfig at ${options.projectRoot}`,
    bodyLines: [
      'This means the Angular functionality may appear broken. In order to fix it, please add "noEmit": false" manually',
    ],
  });
  return null;
}

function updateTsConfig(tree: Tree, options: AngularInitSchema) {
  const tsConfigFileName = getAppTsConfigFileName(tree, options);
  if (!tsConfigFileName) {
    return;
  }
  const tsConfig = readJson(
    tree,
    joinPathFragments(options.projectRoot, tsConfigFileName)
  );
  tsConfig.compilerOptions.noEmit = false;
  tsConfig.compilerOptions.experimentalDecorators = true;
  tsConfig.angularCompilerOptions = {
    enableI18nLegacyMessageIdFormat: false,
    strictInjectionParameters: true,
    strictInputAccessModifiers: true,
    strictTemplates: true,
  };
  writeJson(tree, tsConfigFileName, tsConfig);
}

/**
 * - adds angular example component (either Material or plain angular one)
 * - installs necessary dependencies
 */
export function angularInit(
  tree: Tree,
  options: AngularInitSchema
): GeneratorCallback {
  addFiles(tree, options);
  addAngularPluginToViteConfig(tree, options);
  updateTsConfig(tree, options);
  return addDependencies(tree, !!options.installMaterialExample);
}
