import {
  addProjectConfiguration,
  readJson,
  stripIndents,
  writeJson,
} from '@nrwl/devkit';
import { createTreeWithEmptyV1Workspace } from '@nrwl/devkit/testing';
import update from './setup-tailwind';

describe('setup-tailwind', () => {
  it.each`
    stylesPath
    ${`src/global.css`}
    ${`src/global.scss`}
    ${`src/global.less`}
    ${`src/global.styl`}
  `('should update stylesheet', async ({ stylesPath }) => {
    const tree = createTreeWithEmptyV1Workspace();
    addProjectConfiguration(tree, 'example', {
      root: 'apps/example',
      sourceRoot: 'apps/example/src',
      targets: {},
    });
    tree.write(`apps/example/${stylesPath}`, `/* existing content */`);

    await update(tree, {
      project: 'example',
    });

    expect(tree.read(`apps/example/${stylesPath}`)?.toString()).toEqual(
      stripIndents`
        @tailwind components;
        @tailwind base;
        @tailwind utilities;
        /* existing content */
      `
    );
  });

  it('should add postcss and tailwind config files', async () => {
    const tree = createTreeWithEmptyV1Workspace();
    addProjectConfiguration(tree, 'example', {
      root: 'apps/example',
      sourceRoot: 'apps/example/src',
      targets: {
        build: {
          executor: '@nrwl/vite:build',
          options: {
            outputPath: 'dist/apps/example',
            configFile: 'apps/example/vite.config.ts',
          },
        },
      },
    });
    tree.write(`apps/example/src/global.css`, ``);
    writeJson(tree, 'package.json', {
      devDependencies: {
        '@builder.io/qwik': '999.9.9',
        '@builder.io/qwik-cty': '999.9.9',
      },
    });

    await update(tree, {
      project: 'example',
    });

    expect(tree.exists(`apps/example/postcss.config.js`)).toBeTruthy();
    expect(tree.exists(`apps/example/tailwind.config.js`)).toBeTruthy();
  });

  it('should skip update if postcss configuration already exists', async () => {
    const tree = createTreeWithEmptyV1Workspace();
    addProjectConfiguration(tree, 'example', {
      root: 'apps/example',
      sourceRoot: 'apps/example/src',
      targets: {},
    });
    tree.write(`apps/example/src/global.css`, ``);
    tree.write('apps/example/postcss.config.js', '// existing');

    await update(tree, { project: 'example' });

    expect(tree.read('apps/example/postcss.config.js')?.toString()).toEqual(
      '// existing'
    );
  });

  it('should skip update if tailwind configuration already exists', async () => {
    const tree = createTreeWithEmptyV1Workspace();
    addProjectConfiguration(tree, 'example', {
      root: 'apps/example',
      sourceRoot: 'apps/example/src',
      targets: {},
    });
    tree.write(`apps/example/src/global.css`, ``);
    tree.write('apps/example/tailwind.config.js', '// existing');

    await update(tree, { project: 'example' });

    expect(tree.read('apps/example/tailwind.config.js')?.toString()).toEqual(
      '// existing'
    );
  });

  it('should install packages', async () => {
    const tree = createTreeWithEmptyV1Workspace();
    addProjectConfiguration(tree, 'example', {
      root: 'apps/example',
      sourceRoot: 'apps/example/src',
      targets: {},
    });
    tree.write(`apps/example/src/global.css`, ``);
    writeJson(tree, 'package.json', {
      devDependencies: {
        '@builder.io/qwik': '999.9.9',
        '@builder.io/qwik-cty': '999.9.9',
      },
    });

    await update(tree, {
      project: 'example',
    });

    expect(readJson(tree, 'package.json')).toEqual({
      dependencies: {},
      devDependencies: {
        '@builder.io/qwik': '999.9.9',
        '@builder.io/qwik-cty': '999.9.9',
        autoprefixer: expect.any(String),
        postcss: expect.any(String),
        tailwindcss: expect.any(String),
      },
    });
  });

  it('should support skipping package install', async () => {
    const tree = createTreeWithEmptyV1Workspace();
    addProjectConfiguration(tree, 'example', {
      root: 'apps/example',
      sourceRoot: 'apps/example/src',
      targets: {},
    });
    tree.write(`apps/example/src/global.css`, ``);
    writeJson(tree, 'package.json', {
      devDependencies: {
        '@builder.io/qwik': '999.9.9',
        '@builder.io/qwik-cty': '999.9.9',
      },
    });

    await update(tree, {
      project: 'example',
      skipPackageJson: true,
    });

    expect(readJson(tree, 'package.json')).toEqual({
      devDependencies: {
        '@builder.io/qwik': '999.9.9',
        '@builder.io/qwik-cty': '999.9.9',
      },
    });
  });
});
