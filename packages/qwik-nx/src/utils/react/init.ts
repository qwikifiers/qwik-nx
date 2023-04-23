import {
  GeneratorCallback,
  Tree,
  addDependenciesToPackageJson,
  generateFiles,
} from '@nrwl/devkit';
import path = require('path');
import {
  emotionReactVersion,
  emotionStyledVersion,
  muiDataGridVersion,
  muiMaterialVersion,
  qwikReactVersion,
  reactDOMVersion,
  reactVersion,
  typesReactDOMVersion,
  typesReactVersion,
} from '../versions';
import { updateViteConfig } from '../update-vite-config';
import { normalizeViteConfigFilePathWithTree } from '@nrwl/vite';

export interface ReactInitSchema {
  demoFilePath: string;
  installMUIExample: boolean;
  projectRoot: string;
}

function addFiles(tree: Tree, options: ReactInitSchema, mui: boolean) {
  generateFiles(
    tree,
    path.join(__dirname, 'files', mui ? 'mui' : 'demo'),
    options.demoFilePath,
    {}
  );
}

function addDependencies(tree: Tree, mui: boolean): GeneratorCallback {
  const devDependencies = {
    '@builder.io/qwik-react': qwikReactVersion,
    '@emotion/react': emotionReactVersion,
    '@emotion/styled': emotionStyledVersion,
    '@types/react': typesReactVersion,
    '@types/react-dom': typesReactDOMVersion,
    react: reactVersion,
    'react-dom': reactDOMVersion,
  };
  if (mui) {
    Object.assign(devDependencies, {
      '@mui/material': muiMaterialVersion,
      '@mui/x-data-grid': muiDataGridVersion,
    });
  }
  return addDependenciesToPackageJson(tree, {}, devDependencies);
}

export function addReactPluginToViteConfig(tree: Tree, projectRoot: string) {
  const viteConfigPath = normalizeViteConfigFilePathWithTree(tree, projectRoot);

  if (!viteConfigPath) {
    throw new Error(`Could not resolve vite config at ${projectRoot}`);
  }
  const viteConfig = tree.read(viteConfigPath)!.toString();
  const updatedViteConfig = updateViteConfig(viteConfig, {
    imports: [
      {
        namedImports: ['qwikReact'],
        importPath: '@builder.io/qwik-react/vite',
      },
    ],
    vitePlugins: ['qwikReact()'],
  });
  tree.write(viteConfigPath, updatedViteConfig);
}

/**
 * - adds react example component (either MUI or plain react one)
 * - installs neccessary dependencies
 */
export function reactInit(
  tree: Tree,
  options: ReactInitSchema
): GeneratorCallback {
  addFiles(tree, options, !!options.installMUIExample);
  addReactPluginToViteConfig(tree, options.projectRoot);
  return addDependencies(tree, !!options.installMUIExample);
}
