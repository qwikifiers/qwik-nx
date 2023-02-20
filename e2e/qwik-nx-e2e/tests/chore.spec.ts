import {
  ensureNxProject,
  readJson,
  runNxCommandAsync,
} from '@nrwl/nx-plugin/testing';

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
    it("qwik-nx's package.json should contain only expected dependencies", async () => {
      const packageJson = readJson('node_modules/qwik-nx/package.json');

      expect(packageJson.dependencies).toBeUndefined();
      expect(packageJson.peerDependencies).toEqual({
        '@nrwl/vite': '~15.7.2',
        '@builder.io/qwik': '^0.17.0',
        '@playwright/test': '^1.30.0',
        undici: '^5.18.0',
        vite: '^4.0.0',
        vitest: '^0.25.0',
        tslib: '^2.3.0',
      });
    }, 200000);
  });
});
