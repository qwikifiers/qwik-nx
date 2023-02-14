import { workspaceRoot } from '@nrwl/devkit';
import { qwikNxVite, QwikNxVitePluginOptions } from './qwik-nx-vite.plugin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fileUtils = require('nx/src/project-graph/file-utils');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

const workspaceConfig1 = {
  projects: {
    'tmp-test-app-a': {
      root: 'apps/test-app-a',
      name: 'tmp-test-app-a',
      projectType: 'application',
      sourceRoot: 'apps/test-app-a/src',
      prefix: 'tmp',
      tags: ['tag1', 'tag2'],
    },
    'tmp-test-lib-a': {
      root: 'libs/test-lib-a',
      name: 'tmp-test-lib-a',
      projectType: 'library',
      sourceRoot: 'libs/test-lib-a/src',
      prefix: 'tmp',
      tags: ['tag2'],
    },
    'tmp-test-lib-b': {
      root: 'libs/test-lib-b',
      name: 'tmp-test-lib-b',
      projectType: 'library',
      sourceRoot: 'libs/test-lib-b/src',
      prefix: 'tmp',
      tags: ['tag2', 'tag3'],
    },
    'tmp-test-lib-c-nested-1': {
      root: 'libs/test-lib-c/nested',
      name: 'tmp-test-lib-c-nested-1',
      projectType: 'library',
      sourceRoot: 'libs/test-lib-c/nested-1/src',
      prefix: 'tmp',
      tags: ['tag4'],
    },
    'tmp-test-lib-c-nested-2': {
      root: 'libs/test-lib-c/nested',
      name: 'tmp-test-lib-c-nested-2',
      projectType: 'library',
      sourceRoot: 'libs/test-lib-c/nested-2/src',
      prefix: 'tmp',
      tags: ['tag1', 'tag2', 'tag3'],
    },
    'tmp-other-test-lib-a': {
      root: 'libs/other/test-lib-a',
      name: 'tmp-other-test-lib-a',
      projectType: 'library',
      sourceRoot: 'libs/other/test-lib-a/src',
      prefix: 'tmp',
      tags: [],
    },
  },
};

const tsConfigString1 = JSON.stringify({
  compilerOptions: {
    paths: {
      '@tmp/test-lib-a': 'libs/test-lib-a/src/index.ts',
      '@tmp/test-lib-b': 'libs/test-lib-b/src/index.ts',
      '@tmp/test-lib-c/nested-1': 'libs/test-lib-c/nested-1/src/index.ts',
      '@tmp/test-lib-c/nested-2': 'libs/test-lib-c/nested-2/src/index.ts',
      '@tmp/other/test-lib-a/nested-2': 'libs/other/test-lib-a/src/index.ts',
    },
  },
});

describe('qwik-nx-vite plugin', () => {
  jest
    .spyOn(fileUtils, 'readWorkspaceConfig')
    .mockReturnValue(workspaceConfig1);
  jest.spyOn(fs, 'readFileSync').mockReturnValue(tsConfigString1);

  const getDecoratedPaths = async (options?: QwikNxVitePluginOptions) => {
    const plugin = qwikNxVite(options);
    const vendorRoots = [];
    const qwikViteMock = {
      name: 'vite-plugin-qwik',
      api: {
        getOptions: () => ({ vendorRoots }),
      },
    };
    await (plugin.configResolved as any)({ plugins: [qwikViteMock] });
    return vendorRoots;
  };

  it('Without filters', async () => {
    const paths = await getDecoratedPaths();

    expect(paths).toEqual([
      `${workspaceRoot}/libs/test-lib-a/src`,
      `${workspaceRoot}/libs/test-lib-b/src`,
      `${workspaceRoot}/libs/test-lib-c/nested-1/src`,
      `${workspaceRoot}/libs/test-lib-c/nested-2/src`,
      `${workspaceRoot}/libs/other/test-lib-a/src`,
    ]);
  });

  describe('Name filter', () => {
    describe('As string', () => {
      it('Exclude', async () => {
        const paths = await getDecoratedPaths({
          excludeProjects: {
            name: ['tmp-test-lib-b', 'tmp-test-lib-c-nested-2'],
          },
        });
        expect(paths).toEqual([
          `${workspaceRoot}/libs/test-lib-a/src`,
          `${workspaceRoot}/libs/test-lib-c/nested-1/src`,
          `${workspaceRoot}/libs/other/test-lib-a/src`,
        ]);
      });
      it('Include', async () => {
        const paths = await getDecoratedPaths({
          includeProjects: {
            name: ['tmp-test-lib-b', 'tmp-test-lib-c-nested-2'],
          },
        });
        expect(paths).toEqual([
          `${workspaceRoot}/libs/test-lib-b/src`,
          `${workspaceRoot}/libs/test-lib-c/nested-2/src`,
        ]);
      });
      it('Both', async () => {
        const paths = await getDecoratedPaths({
          includeProjects: { name: ['tmp-test-lib-c-nested-2'] },
          excludeProjects: { name: ['tmp-test-lib-b'] },
        });
        expect(paths).toEqual([
          `${workspaceRoot}/libs/test-lib-c/nested-2/src`,
        ]);
      });
    });
    describe('As regexp', () => {
      it('Exclude', async () => {
        const paths = await getDecoratedPaths({
          excludeProjects: { name: /lib-a/ },
        });
        expect(paths).toEqual([
          `${workspaceRoot}/libs/test-lib-b/src`,
          `${workspaceRoot}/libs/test-lib-c/nested-1/src`,
          `${workspaceRoot}/libs/test-lib-c/nested-2/src`,
        ]);
      });
      it('Exclude - ends with', async () => {
        const paths = await getDecoratedPaths({
          excludeProjects: { name: /tmp-test-lib-\w$/ },
        });
        expect(paths).toEqual([
          `${workspaceRoot}/libs/test-lib-c/nested-1/src`,
          `${workspaceRoot}/libs/test-lib-c/nested-2/src`,
          `${workspaceRoot}/libs/other/test-lib-a/src`,
        ]);
      });
      it('Exclude - wrong value', async () => {
        const paths = await getDecoratedPaths({
          excludeProjects: { name: /test-lib$/ },
        });
        expect(paths).toEqual([
          `${workspaceRoot}/libs/test-lib-a/src`,
          `${workspaceRoot}/libs/test-lib-b/src`,
          `${workspaceRoot}/libs/test-lib-c/nested-1/src`,
          `${workspaceRoot}/libs/test-lib-c/nested-2/src`,
          `${workspaceRoot}/libs/other/test-lib-a/src`,
        ]);
      });
      it('Include', async () => {
        const paths = await getDecoratedPaths({
          includeProjects: { name: /nested/ },
        });
        expect(paths).toEqual([
          `${workspaceRoot}/libs/test-lib-c/nested-1/src`,
          `${workspaceRoot}/libs/test-lib-c/nested-2/src`,
        ]);
      });

      it('Include - with "global" flag', async () => {
        const paths = await getDecoratedPaths({
          includeProjects: { name: /nested/g },
        });
        expect(paths).toEqual([
          `${workspaceRoot}/libs/test-lib-c/nested-1/src`,
          `${workspaceRoot}/libs/test-lib-c/nested-2/src`,
        ]);
      });

      it('Both', async () => {
        const paths = await getDecoratedPaths({
          includeProjects: { name: /nested/ },
          excludeProjects: { name: /nested-2/ },
        });
        expect(paths).toEqual([
          `${workspaceRoot}/libs/test-lib-c/nested-1/src`,
        ]);
      });
    });
  });

  describe('Path filter', () => {
    it('Exclude', async () => {
      const paths = await getDecoratedPaths({
        excludeProjects: { path: /other\/test/ },
      });
      expect(paths).toEqual([
        `${workspaceRoot}/libs/test-lib-a/src`,
        `${workspaceRoot}/libs/test-lib-b/src`,
        `${workspaceRoot}/libs/test-lib-c/nested-1/src`,
        `${workspaceRoot}/libs/test-lib-c/nested-2/src`,
      ]);
    });
    it('Include', async () => {
      const paths = await getDecoratedPaths({
        includeProjects: { path: /nested/ },
      });
      expect(paths).toEqual([
        `${workspaceRoot}/libs/test-lib-c/nested-1/src`,
        `${workspaceRoot}/libs/test-lib-c/nested-2/src`,
      ]);
    });

    it('Include - with "global" flag', async () => {
      const paths = await getDecoratedPaths({
        includeProjects: { path: /nested/g },
      });
      expect(paths).toEqual([
        `${workspaceRoot}/libs/test-lib-c/nested-1/src`,
        `${workspaceRoot}/libs/test-lib-c/nested-2/src`,
      ]);
    });

    it('Both', async () => {
      const paths = await getDecoratedPaths({
        includeProjects: { path: /lib-a/ },
        excludeProjects: { path: /other/ },
      });
      expect(paths).toEqual([`${workspaceRoot}/libs/test-lib-a/src`]);
    });
  });

  describe('Tags filter', () => {
    it('Exclude', async () => {
      const paths = await getDecoratedPaths({
        excludeProjects: { tags: ['tag1'] },
      });
      expect(paths).toEqual([
        `${workspaceRoot}/libs/test-lib-a/src`,
        `${workspaceRoot}/libs/test-lib-b/src`,
        `${workspaceRoot}/libs/test-lib-c/nested-1/src`,
        `${workspaceRoot}/libs/other/test-lib-a/src`,
      ]);
    });
    it('Exclude multiple', async () => {
      const paths = await getDecoratedPaths({
        excludeProjects: { tags: ['tag1', 'tag3'] },
      });
      expect(paths).toEqual([
        `${workspaceRoot}/libs/test-lib-a/src`,
        `${workspaceRoot}/libs/test-lib-c/nested-1/src`,
        `${workspaceRoot}/libs/other/test-lib-a/src`,
      ]);
    });
    it('Include', async () => {
      const paths = await getDecoratedPaths({
        includeProjects: { tags: ['tag3'] },
      });
      expect(paths).toEqual([
        `${workspaceRoot}/libs/test-lib-b/src`,
        `${workspaceRoot}/libs/test-lib-c/nested-2/src`,
      ]);
    });
    it('Include multiple', async () => {
      const paths = await getDecoratedPaths({
        includeProjects: { tags: ['tag1', 'tag3'] },
      });
      expect(paths).toEqual([`${workspaceRoot}/libs/test-lib-c/nested-2/src`]);
    });
  });
  describe('Custom filter', () => {
    it('Exclude', async () => {
      const paths = await getDecoratedPaths({
        excludeProjects: { customFilter: (p) => p.name === 'tmp-test-lib-a' },
      });
      expect(paths).toEqual([
        `${workspaceRoot}/libs/test-lib-b/src`,
        `${workspaceRoot}/libs/test-lib-c/nested-1/src`,
        `${workspaceRoot}/libs/test-lib-c/nested-2/src`,
        `${workspaceRoot}/libs/other/test-lib-a/src`,
      ]);
    });
    it('Exclude', async () => {
      const paths = await getDecoratedPaths({
        includeProjects: { customFilter: (p) => p.name === 'tmp-test-lib-a' },
      });
      expect(paths).toEqual([`${workspaceRoot}/libs/test-lib-a/src`]);
    });
  });
});
