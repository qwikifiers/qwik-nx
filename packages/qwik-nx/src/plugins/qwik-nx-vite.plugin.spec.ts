import {
  ProjectGraph,
  ProjectsConfigurations,
  workspaceRoot,
} from '@nx/devkit';
import { join } from 'path';
import { qwikNxVite } from './qwik-nx-vite.plugin';
import { QwikNxVitePluginOptions } from './models/qwik-nx-vite';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nxDevkit = require('@nx/devkit');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const getProjectDependenciesModule = require('./utils/get-project-dependencies');

function getProjectsGraph(): Partial<ProjectGraph> {
  return {
    nodes: {
      'tmp-test-app-a': {
        name: 'tmp-test-app-a',
        type: 'app',
        data: {
          root: 'apps/test-app-a',
          sourceRoot: 'apps/test-app-a/src',
          projectType: 'application',
          tags: ['tag1', 'tag2'],
        },
      },
      'tmp-test-lib-a': {
        name: 'tmp-test-lib-a',
        type: 'lib',
        data: {
          root: 'libs/test-lib-a',
          sourceRoot: 'libs/test-lib-a/src',
          projectType: 'library',
          tags: ['tag2'],
        },
      },
      'tmp-test-lib-b': {
        name: 'tmp-test-lib-b',
        type: 'lib',
        data: {
          root: 'libs/test-lib-b',
          sourceRoot: 'libs/test-lib-b/src',
          projectType: 'library',
          tags: ['tag2', 'tag3'],
        },
      },
      'tmp-test-lib-c-nested-1': {
        name: 'tmp-test-lib-c-nested-1',
        type: 'lib',
        data: {
          root: 'libs/test-lib-c/nested',
          sourceRoot: 'libs/test-lib-c/nested-1/src',
          projectType: 'library',
          tags: ['tag4'],
        },
      },
    },
  };
}

function getWorkspaceConfig(): Partial<ProjectsConfigurations> {
  return {
    projects: {
      'tmp-test-app-a': {
        root: 'apps/test-app-a',
        name: 'tmp-test-app-a',
        projectType: 'application',
        sourceRoot: 'apps/test-app-a/src',
        tags: ['tag1', 'tag2'],
      },
      'tmp-test-lib-a': {
        root: 'libs/test-lib-a',
        name: 'tmp-test-lib-a',
        projectType: 'library',
        sourceRoot: 'libs/test-lib-a/src',
        tags: ['tag2'],
      },
      'tmp-test-lib-b': {
        root: 'libs/test-lib-b',
        name: 'tmp-test-lib-b',
        projectType: 'library',
        sourceRoot: 'libs/test-lib-b/src',
        tags: ['tag2', 'tag3'],
      },
      'tmp-test-lib-c-nested-1': {
        root: 'libs/test-lib-c/nested',
        name: 'tmp-test-lib-c-nested-1',
        projectType: 'library',
        sourceRoot: 'libs/test-lib-c/nested-1/src',
        tags: ['tag4'],
      },
      'tmp-test-lib-c-nested-2': {
        root: 'libs/test-lib-c/nested',
        name: 'tmp-test-lib-c-nested-2',
        projectType: 'library',
        sourceRoot: 'libs/test-lib-c/nested-2/src',
        tags: ['tag1', 'tag2', 'tag3'],
      },
      'tmp-other-test-lib-a': {
        root: 'libs/other/test-lib-a',
        name: 'tmp-other-test-lib-a',
        projectType: 'library',
        sourceRoot: 'libs/other/test-lib-a/src',
        tags: [],
      },
      // it will be excluded because it is not set in our mock tsconfig.json
      'tmp-always-excluded': {
        root: 'libs/always/excluded',
        name: 'tmp-always-excluded',
        projectType: 'library',
        sourceRoot: 'libs/always/excluded/src',
        tags: [],
      },
    },
  };
}

function getTsConfigString() {
  return JSON.stringify({
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
}

describe('qwik-nx-vite plugin', () => {
  jest
    .spyOn(nxDevkit, 'readProjectsConfigurationFromProjectGraph')
    .mockReturnValue(getWorkspaceConfig());
  jest
    .spyOn(nxDevkit, 'readCachedProjectGraph')
    .mockReturnValue(getProjectsGraph());
  const originalReadFileSync = jest.requireActual('fs').readFileSync;
  jest.spyOn(fs, 'readFileSync').mockImplementation((fileName, ...args) => {
    if (
      typeof fileName === 'string' &&
      fileName.endsWith('tsconfig.base.json')
    ) {
      return getTsConfigString();
    }
    return originalReadFileSync(fileName, ...args);
  });
  jest
    .spyOn(getProjectDependenciesModule, 'getProjectDependencies')
    .mockReturnValue(
      Promise.resolve(new Set(Object.keys(getWorkspaceConfig().projects!)))
    );

  /**
   * @param options options for the qwikNxVite plugin
   * @param qwikPluginRootDir mock root dir that is supposed to be available in the qwik plugin
   */
  const getDecoratedPaths = async (
    options?: QwikNxVitePluginOptions,
    qwikPluginRootDir?: string
  ): Promise<string[]> => {
    let currentProjectName: string | undefined;
    if (options?.currentProjectName || qwikPluginRootDir) {
      // not defining it if rootDir is provided
      currentProjectName = options?.currentProjectName;
    } else {
      // do not exclude any projects by setting "currentProjectName" to the "tmp-always-excluded", which is not present in the mock tsconfig
      currentProjectName = 'tmp-always-excluded';
    }
    const plugin = qwikNxVite({
      ...options,
      currentProjectName,
    });
    const vendorRoots: string[] = [];
    const qwikViteMock = {
      name: 'vite-plugin-qwik',
      api: {
        getOptions: () => ({ vendorRoots, rootDir: qwikPluginRootDir }),
      },
    };
    await (plugin.configResolved as any)({ plugins: [qwikViteMock] });
    return vendorRoots;
  };

  const toAbsolute = (path: string) => join(workspaceRoot, path);

  it('Without filters', async () => {
    const paths = await getDecoratedPaths();

    expect(paths).toEqual([
      toAbsolute(`/libs/test-lib-a/src`),
      toAbsolute(`/libs/test-lib-b/src`),
      toAbsolute(`/libs/test-lib-c/nested-1/src`),
      toAbsolute(`/libs/test-lib-c/nested-2/src`),
      toAbsolute(`/libs/other/test-lib-a/src`),
    ]);
  });

  describe('Should not include current project as a vendor root for itself', () => {
    it('with project name specified', async () => {
      const paths = await getDecoratedPaths({
        currentProjectName: 'tmp-test-lib-a',
      });

      expect(paths).toEqual([
        toAbsolute(`/libs/test-lib-b/src`),
        toAbsolute(`/libs/test-lib-c/nested-1/src`),
        toAbsolute(`/libs/test-lib-c/nested-2/src`),
        toAbsolute(`/libs/other/test-lib-a/src`),
      ]);
    });

    describe('implicitly by the root dir from the qwik plugin', () => {
      it('relative to workspace root', async () => {
        const paths = await getDecoratedPaths(undefined, 'libs/test-lib-b');

        expect(paths).toEqual([
          toAbsolute(`/libs/test-lib-a/src`),
          toAbsolute(`/libs/test-lib-c/nested-1/src`),
          toAbsolute(`/libs/test-lib-c/nested-2/src`),
          toAbsolute(`/libs/other/test-lib-a/src`),
        ]);
      });
      it('absolute', async () => {
        const paths = await getDecoratedPaths(
          undefined,
          join(workspaceRoot, 'libs/test-lib-b')
        );

        expect(paths).toEqual([
          toAbsolute(`/libs/test-lib-a/src`),
          toAbsolute(`/libs/test-lib-c/nested-1/src`),
          toAbsolute(`/libs/test-lib-c/nested-2/src`),
          toAbsolute(`/libs/other/test-lib-a/src`),
        ]);
      });
    });

    describe('validation', () => {
      it('should throw if invalid project is provided', async () => {
        const invalidProjectName = 'tmp-test-lib-a-123';
        await expect(
          getDecoratedPaths({
            currentProjectName: invalidProjectName,
          })
        ).rejects.toThrow(
          `Could not find project with name "${invalidProjectName}"`
        );
      });
      it('should throw if for some reason path from qwik plugin could not be resolved', async () => {
        const invalidPath = 'libs/libs/test-lib-b';
        await expect(getDecoratedPaths(undefined, invalidPath)).rejects.toThrow(
          `Could not resolve the project name for path "${invalidPath}"`
        );
      });
    });
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
          toAbsolute(`/libs/test-lib-a/src`),
          toAbsolute(`/libs/test-lib-c/nested-1/src`),
          toAbsolute(`/libs/other/test-lib-a/src`),
        ]);
      });
      it('Include', async () => {
        const paths = await getDecoratedPaths({
          includeProjects: {
            name: ['tmp-test-lib-b', 'tmp-test-lib-c-nested-2'],
          },
        });
        expect(paths).toEqual([
          toAbsolute(`/libs/test-lib-b/src`),
          toAbsolute(`/libs/test-lib-c/nested-2/src`),
        ]);
      });
      it('Both', async () => {
        const paths = await getDecoratedPaths({
          includeProjects: { name: ['tmp-test-lib-c-nested-2'] },
          excludeProjects: { name: ['tmp-test-lib-b'] },
        });
        expect(paths).toEqual([toAbsolute(`/libs/test-lib-c/nested-2/src`)]);
      });
    });
    describe('As regexp', () => {
      it('Exclude', async () => {
        const paths = await getDecoratedPaths({
          excludeProjects: { name: /lib-a/ },
        });
        expect(paths).toEqual([
          toAbsolute(`/libs/test-lib-b/src`),
          toAbsolute(`/libs/test-lib-c/nested-1/src`),
          toAbsolute(`/libs/test-lib-c/nested-2/src`),
        ]);
      });
      it('Exclude - ends with', async () => {
        const paths = await getDecoratedPaths({
          excludeProjects: { name: /tmp-test-lib-\w$/ },
        });
        expect(paths).toEqual([
          toAbsolute(`/libs/test-lib-c/nested-1/src`),
          toAbsolute(`/libs/test-lib-c/nested-2/src`),
          toAbsolute(`/libs/other/test-lib-a/src`),
        ]);
      });
      it('Exclude - wrong value', async () => {
        const paths = await getDecoratedPaths({
          excludeProjects: { name: /test-lib$/ },
        });
        expect(paths).toEqual([
          toAbsolute(`/libs/test-lib-a/src`),
          toAbsolute(`/libs/test-lib-b/src`),
          toAbsolute(`/libs/test-lib-c/nested-1/src`),
          toAbsolute(`/libs/test-lib-c/nested-2/src`),
          toAbsolute(`/libs/other/test-lib-a/src`),
        ]);
      });
      it('Include', async () => {
        const paths = await getDecoratedPaths({
          includeProjects: { name: /nested/ },
        });
        expect(paths).toEqual([
          toAbsolute(`/libs/test-lib-c/nested-1/src`),
          toAbsolute(`/libs/test-lib-c/nested-2/src`),
        ]);
      });

      it('Include - with "global" flag', async () => {
        const paths = await getDecoratedPaths({
          includeProjects: { name: /nested/g },
        });
        expect(paths).toEqual([
          toAbsolute(`/libs/test-lib-c/nested-1/src`),
          toAbsolute(`/libs/test-lib-c/nested-2/src`),
        ]);
      });

      it('Both', async () => {
        const paths = await getDecoratedPaths({
          includeProjects: { name: /nested/ },
          excludeProjects: { name: /nested-2/ },
        });
        expect(paths).toEqual([toAbsolute(`/libs/test-lib-c/nested-1/src`)]);
      });
    });
  });

  describe('Path filter', () => {
    it('Exclude', async () => {
      const paths = await getDecoratedPaths({
        excludeProjects: { path: /other\/test/ },
      });
      expect(paths).toEqual([
        toAbsolute(`/libs/test-lib-a/src`),
        toAbsolute(`/libs/test-lib-b/src`),
        toAbsolute(`/libs/test-lib-c/nested-1/src`),
        toAbsolute(`/libs/test-lib-c/nested-2/src`),
      ]);
    });
    it('Include', async () => {
      const paths = await getDecoratedPaths({
        includeProjects: { path: /nested/ },
      });
      expect(paths).toEqual([
        toAbsolute(`/libs/test-lib-c/nested-1/src`),
        toAbsolute(`/libs/test-lib-c/nested-2/src`),
      ]);
    });

    it('Include - with "global" flag', async () => {
      const paths = await getDecoratedPaths({
        includeProjects: { path: /nested/g },
      });
      expect(paths).toEqual([
        toAbsolute(`/libs/test-lib-c/nested-1/src`),
        toAbsolute(`/libs/test-lib-c/nested-2/src`),
      ]);
    });

    it('Both', async () => {
      const paths = await getDecoratedPaths({
        includeProjects: { path: /lib-a/ },
        excludeProjects: { path: /other/ },
      });
      expect(paths).toEqual([toAbsolute(`/libs/test-lib-a/src`)]);
    });
  });

  describe('Tags filter', () => {
    it('Exclude', async () => {
      const paths = await getDecoratedPaths({
        excludeProjects: { tags: ['tag1'] },
      });
      expect(paths).toEqual([
        toAbsolute(`/libs/test-lib-a/src`),
        toAbsolute(`/libs/test-lib-b/src`),
        toAbsolute(`/libs/test-lib-c/nested-1/src`),
        toAbsolute(`/libs/other/test-lib-a/src`),
      ]);
    });
    it('Exclude multiple', async () => {
      const paths = await getDecoratedPaths({
        excludeProjects: { tags: ['tag1', 'tag3'] },
      });
      expect(paths).toEqual([
        toAbsolute(`/libs/test-lib-a/src`),
        toAbsolute(`/libs/test-lib-c/nested-1/src`),
        toAbsolute(`/libs/other/test-lib-a/src`),
      ]);
    });
    it('Include', async () => {
      const paths = await getDecoratedPaths({
        includeProjects: { tags: ['tag3'] },
      });
      expect(paths).toEqual([
        toAbsolute(`/libs/test-lib-b/src`),
        toAbsolute(`/libs/test-lib-c/nested-2/src`),
      ]);
    });
    it('Include multiple', async () => {
      const paths = await getDecoratedPaths({
        includeProjects: { tags: ['tag1', 'tag3'] },
      });
      expect(paths).toEqual([toAbsolute(`/libs/test-lib-c/nested-2/src`)]);
    });
  });
  describe('Custom filter', () => {
    it('Exclude', async () => {
      const paths = await getDecoratedPaths({
        excludeProjects: { customFilter: (p) => p.name === 'tmp-test-lib-a' },
      });
      expect(paths).toEqual([
        toAbsolute(`/libs/test-lib-b/src`),
        toAbsolute(`/libs/test-lib-c/nested-1/src`),
        toAbsolute(`/libs/test-lib-c/nested-2/src`),
        toAbsolute(`/libs/other/test-lib-a/src`),
      ]);
    });
    it('Exclude', async () => {
      const paths = await getDecoratedPaths({
        includeProjects: { customFilter: (p) => p.name === 'tmp-test-lib-a' },
      });
      expect(paths).toEqual([toAbsolute(`/libs/test-lib-a/src`)]);
    });
  });
});
