import {
  ensureNxProject,
  listFiles,
  readJson,
  runNxCommandAsync,
} from '@nx/plugin/testing';
import { DEFAULT_E2E_TIMEOUT } from '@qwikifiers/e2e/utils';

describe('misc checks', () => {
  beforeAll(() => {
    ensureNxProject('qwik-nx', 'dist/packages/qwik-nx');
  });

  afterAll(async () => {
    await runNxCommandAsync('reset');
  });

  it(
    "qwik-nx's package.json should contain only expected dependencies",
    async () => {
      const packageJson = readJson('node_modules/qwik-nx/package.json');

      expect(packageJson.dependencies).toBeUndefined();
      expect(packageJson.devDependencies).toBeUndefined();
      expect(packageJson.peerDependencies).toEqual({
        '@nx/devkit': '^20.0.0',
        '@nx/js': '^20.0.0',
        '@nx/eslint': '^20.0.0',
        '@nx/vite': '^20.0.0',
      });
    },
    DEFAULT_E2E_TIMEOUT
  );

  it('compiled output should contain all expected files', () => {
    const expectedFiles = [
      'executors.json',
      'migrations.json',
      'generators.json',
      'README.md',
    ];
    const files = new Set(listFiles('node_modules/qwik-nx'));
    expect(expectedFiles.every((f) => files.has(f)));
  });
});
