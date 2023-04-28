import {
  ensureNxProject,
  readJson,
  runNxCommandAsync,
} from '@nx/plugin/testing';
import { DEFAULT_E2E_TIMEOUT } from '@qwikifiers/e2e/utils';

describe('appGenerator e2e', () => {
  // Setting up individual workspaces per
  // test can cause e2e runs to take a long time.
  // For this reason, we recommend each suite only
  // consumes 1 workspace. The tests should each operate
  // on a unique project in the workspace, such that they
  // are not dependant on one another.
  beforeAll(() => {
    ensureNxProject('qwik-nx', 'dist/packages/qwik-nx');
  });

  afterAll(async () => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    await runNxCommandAsync('reset');
  });

  describe("qwik-nx's compiled package.json", () => {
    it(
      "qwik-nx's package.json should contain only expected dependencies",
      async () => {
        const packageJson = readJson('node_modules/qwik-nx/package.json');

        expect(packageJson.peerDependencies).toBeUndefined();
        expect(packageJson.dependencies).toEqual({
          '@nx/devkit': '^16.0.0',
          '@nx/js': '^16.0.0',
          '@nx/linter': '^16.0.0',
          '@nx/vite': '^16.0.0',
        });
      },
      DEFAULT_E2E_TIMEOUT
    );
  });
});
