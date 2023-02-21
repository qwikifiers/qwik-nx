import {
  addProjectConfiguration,
  ProjectConfiguration,
  readProjectConfiguration,
  Tree,
} from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import migrate from './switch-to-qwik-nx-build-executor';

describe('Use new "qwik-nx:build" executor in qwik apps', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should update targets in a standard project.json', async () => {
    addProjectConfiguration(
      tree,
      'myapp',
      getSampleProjectJson().oldFormatWithCF
    );

    await migrate(tree);

    expect(readProjectConfiguration(tree, 'myapp')).toEqual(
      getSampleProjectJson().newFormatWithCF
    );
  });
});

function getSampleProjectJson() {
  return {
    oldFormat: {
      root: 'apps/myapp',
      name: 'myapp',
      $schema: '../../node_modules/nx/schemas/project-schema.json',
      projectType: 'application',
      sourceRoot: 'apps/myapp/src',
      targets: {
        build: {
          executor: '@nrwl/vite:build',
          options: {
            outputPath: 'dist/apps/myapp',
            configFile: 'apps/myapp/vite.config.ts',
          },
        },
        'build-ssr': {
          executor: '@nrwl/vite:build',
          defaultConfiguration: 'preview',
          options: {
            outputPath: 'dist/apps/myapp',
          },
          configurations: {
            preview: {
              ssr: 'src/entry.preview.tsx',
              mode: 'production',
            },
          },
          dependsOn: ['build'],
        },
        preview: {
          executor: 'nx:run-commands',
          options: {
            command: 'vite preview',
            cwd: 'apps/myapp',
          },
          dependsOn: ['build-ssr'],
        },
        test: {
          executor: '@nrwl/vite:test',
          outputs: ['../../coverage/apps/myapp'],
          options: {
            passWithNoTests: true,
            reportsDirectory: '../../coverage/apps/myapp',
          },
        },
        serve: {
          executor: '@nrwl/vite:dev-server',
          defaultConfiguration: 'development',
          options: {
            buildTarget: 'myapp:build',
            mode: 'ssr',
          },
          configurations: {
            development: {
              buildTarget: 'myapp:build:development',
              hmr: true,
            },
            production: {
              buildTarget: 'myapp:build:production',
              hmr: false,
            },
          },
        },
        serveDebug: {
          executor: 'nx:run-commands',
          options: {
            command:
              'node --inspect-brk ../../node_modules/vite/bin/vite.js --mode ssr --force',
            cwd: 'apps/myapp',
          },
        },
        lint: {
          executor: '@nrwl/linter:eslint',
          outputs: ['{options.outputFile}'],
          options: {
            lintFilePatterns: ['apps/myapp/**/*.{ts,tsx,js,jsx}'],
          },
        },
      },
      tags: [],
    } as ProjectConfiguration,
    newFormat: {
      root: 'apps/myapp',
      name: 'myapp',
      $schema: '../../node_modules/nx/schemas/project-schema.json',
      projectType: 'application',
      sourceRoot: 'apps/myapp/src',
      targets: {
        build: {
          executor: 'qwik-nx:build',
          options: {
            runSequence: ['myapp:build.client', 'myapp:build.ssr'],
            outputPath: 'dist/apps/myapp',
          },
        },
        'build.client': {
          executor: '@nrwl/vite:build',
          options: {
            outputPath: 'dist/apps/myapp',
            configFile: 'apps/myapp/vite.config.ts',
          },
        },
        'build.ssr': {
          executor: '@nrwl/vite:build',
          defaultConfiguration: 'preview',
          options: {
            outputPath: 'dist/apps/myapp',
          },
          configurations: {
            preview: {
              ssr: 'src/entry.preview.tsx',
              mode: 'production',
            },
          },
          dependsOn: [],
        },
        preview: {
          executor: 'nx:run-commands',
          options: {
            command: 'vite preview',
            cwd: 'apps/myapp',
          },
          dependsOn: ['build'],
        },
        test: {
          executor: '@nrwl/vite:test',
          outputs: ['../../coverage/apps/myapp'],
          options: {
            passWithNoTests: true,
            reportsDirectory: '../../coverage/apps/myapp',
          },
        },
        serve: {
          executor: '@nrwl/vite:dev-server',
          defaultConfiguration: 'development',
          options: {
            buildTarget: 'myapp:build.client',
            mode: 'ssr',
          },
          configurations: {
            development: {
              buildTarget: 'myapp:build.client:development',
              hmr: true,
            },
            production: {
              buildTarget: 'myapp:build.client:production',
              hmr: false,
            },
          },
        },
        'serve.debug': {
          executor: 'nx:run-commands',
          options: {
            command:
              'node --inspect-brk ../../node_modules/vite/bin/vite.js --mode ssr --force',
            cwd: 'apps/myapp',
          },
        },
        lint: {
          executor: '@nrwl/linter:eslint',
          outputs: ['{options.outputFile}'],
          options: {
            lintFilePatterns: ['apps/myapp/**/*.{ts,tsx,js,jsx}'],
          },
        },
      },
      tags: [],
    } as ProjectConfiguration,
    oldFormatWithCF: {
      root: 'apps/myapp',
      name: 'myapp',
      $schema: '../../node_modules/nx/schemas/project-schema.json',
      projectType: 'application',
      sourceRoot: 'apps/myapp/src',
      targets: {
        build: {
          executor: '@nrwl/vite:build',
          options: {
            outputPath: 'dist/apps/myapp',
            configFile: 'apps/myapp/vite.config.ts',
          },
        },
        'build-ssr': {
          executor: '@nrwl/vite:build',
          defaultConfiguration: 'preview',
          options: {
            outputPath: 'dist/apps/myapp',
          },
          configurations: {
            preview: {
              ssr: 'src/entry.preview.tsx',
              mode: 'production',
            },
            'cloudflare-pages': {
              configFile: 'apps/myapp/adaptors/cloudflare-pages/vite.config.ts',
            },
          },
          dependsOn: ['build'],
        },
        preview: {
          executor: 'nx:run-commands',
          options: {
            command: 'vite preview',
            cwd: 'apps/myapp',
          },
          dependsOn: ['build-ssr'],
        },
        test: {
          executor: '@nrwl/vite:test',
          outputs: ['../../coverage/apps/myapp'],
          options: {
            passWithNoTests: true,
            reportsDirectory: '../../coverage/apps/myapp',
          },
        },
        serve: {
          executor: '@nrwl/vite:dev-server',
          options: {
            buildTarget: 'myapp:build',
            mode: 'ssr',
          },
        },
        serveDebug: {
          executor: 'nx:run-commands',
          options: {
            command:
              'node --inspect-brk ../../node_modules/vite/bin/vite.js --mode ssr --force',
            cwd: 'apps/myapp',
          },
        },
        lint: {
          executor: '@nrwl/linter:eslint',
          outputs: ['{options.outputFile}'],
          options: {
            lintFilePatterns: ['apps/myapp/**/*.{ts,tsx,js,jsx}'],
          },
        },
        deploy: {
          executor: '@k11r/nx-cloudflare-wrangler:deploy-page',
          options: {
            dist: 'dist/apps/myapp/client',
          },
          dependsOn: ['build-ssr-cloudflare-pages'],
        },
        'preview-cloudflare-pages': {
          executor: '@k11r/nx-cloudflare-wrangler:serve-page',
          options: {
            dist: 'dist/apps/myapp/client',
          },
          dependsOn: ['build-ssr-cloudflare-pages'],
        },
        'build-ssr-cloudflare-pages': {
          executor: 'nx:run-commands',
          options: {
            command: 'npx nx run myapp:build-ssr:cloudflare-pages',
          },
        },
      },
      tags: [],
    } as ProjectConfiguration,
    newFormatWithCF: {
      root: 'apps/myapp',
      name: 'myapp',
      $schema: '../../node_modules/nx/schemas/project-schema.json',
      projectType: 'application',
      sourceRoot: 'apps/myapp/src',
      targets: {
        build: {
          executor: 'qwik-nx:build',
          options: {
            runSequence: ['myapp:build.client', 'myapp:build.ssr'],
            outputPath: 'dist/apps/myapp',
          },
          configurations: {
            'cloudflare-pages': {},
            preview: {},
          },
        },
        'build.client': {
          executor: '@nrwl/vite:build',
          options: {
            outputPath: 'dist/apps/myapp',
            configFile: 'apps/myapp/vite.config.ts',
          },
        },
        'build.ssr': {
          executor: '@nrwl/vite:build',
          defaultConfiguration: 'preview',
          options: {
            outputPath: 'dist/apps/myapp',
          },
          configurations: {
            preview: {
              ssr: 'src/entry.preview.tsx',
              mode: 'production',
            },
            'cloudflare-pages': {
              configFile: 'apps/myapp/adaptors/cloudflare-pages/vite.config.ts',
            },
          },
          dependsOn: [],
        },
        preview: {
          executor: 'nx:run-commands',
          options: {
            command: 'vite preview',
            cwd: 'apps/myapp',
          },
          dependsOn: ['build'],
        },
        test: {
          executor: '@nrwl/vite:test',
          outputs: ['../../coverage/apps/myapp'],
          options: {
            passWithNoTests: true,
            reportsDirectory: '../../coverage/apps/myapp',
          },
        },
        serve: {
          executor: '@nrwl/vite:dev-server',
          options: {
            buildTarget: 'myapp:build.client',
            mode: 'ssr',
          },
        },
        'serve.debug': {
          executor: 'nx:run-commands',
          options: {
            command:
              'node --inspect-brk ../../node_modules/vite/bin/vite.js --mode ssr --force',
            cwd: 'apps/myapp',
          },
        },
        lint: {
          executor: '@nrwl/linter:eslint',
          outputs: ['{options.outputFile}'],
          options: {
            lintFilePatterns: ['apps/myapp/**/*.{ts,tsx,js,jsx}'],
          },
        },
        deploy: {
          executor: '@k11r/nx-cloudflare-wrangler:deploy-page',
          options: {
            dist: 'dist/apps/myapp/client',
          },
          dependsOn: ['build-ssr-cloudflare-pages'],
        },
        'preview-cloudflare-pages': {
          executor: '@k11r/nx-cloudflare-wrangler:serve-page',
          options: {
            dist: 'dist/apps/myapp/client',
          },
          dependsOn: ['build-ssr-cloudflare-pages'],
        },
        'build-ssr-cloudflare-pages': {
          executor: 'nx:run-commands',
          options: {
            command: 'npx nx run myapp:build:cloudflare-pages',
          },
        },
      },
      tags: [],
    } as ProjectConfiguration,
  };
}
