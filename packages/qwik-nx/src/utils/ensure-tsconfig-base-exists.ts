import { Tree } from '@nrwl/devkit';

export function ensureTsConfigBaseExists(tree: Tree) {
  if (!tree.exists('tsconfig.base.json')) {
    tree.write('tsconfig.base.json', getBasicTsConfig());
  }
}

function getBasicTsConfig(): string {
  return JSON.stringify({
    compileOnSave: false,
    compilerOptions: {
      rootDir: '.',
      sourceMap: true,
      declaration: false,
      moduleResolution: 'node',
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      importHelpers: true,
      target: 'es2015',
      module: 'esnext',
      lib: ['es2017', 'dom'],
      skipLibCheck: true,
      skipDefaultLibCheck: true,
      baseUrl: '.',
      paths: {},
    },
    exclude: ['node_modules', 'tmp'],
  });
}
