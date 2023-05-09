import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration, readJson } from '@nx/devkit';

import generator from './generator';
import { HostGeneratorSchema } from './schema';
import { getFormattedListChanges } from '../../utils/testing-generators';

describe('host generator', () => {
  let appTree: Tree;
  const options: HostGeneratorSchema = {
    name: 'myhostapp',
    remotes: ['remote1', 'remote2'],
  };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'myhostapp');
    expect(config).toBeDefined();

    expect(readJson(appTree, 'apps/myhostapp/src/config/remotes.json')).toEqual(
      {
        remote1: 'http://localhost:4201',
        remote2: 'http://localhost:4202',
      }
    );

    // host snapshots
    expect(
      appTree.read('apps/myhostapp/vite.config.ts', 'utf-8')
    ).toMatchSnapshot();
    expect(
      appTree.read('apps/myhostapp/src/entry.ssr.tsx', 'utf-8')
    ).toMatchSnapshot();
    expect(
      appTree.read('apps/myhostapp/project.json', 'utf-8')
    ).toMatchSnapshot();
    expect(getFormattedListChanges(appTree)).toMatchSnapshot();

    // remote snapshots
    for (const remote of ['remote1', 'remote2']) {
      expect(
        appTree.read(`apps/${remote}/vite.config.ts`, 'utf-8')
      ).toMatchSnapshot();
      expect(
        appTree.read(`apps/${remote}/src/entry.ssr.tsx`, 'utf-8')
      ).toMatchSnapshot();
      expect(
        appTree.read(`apps/${remote}/project.json`, 'utf-8')
      ).toMatchSnapshot();
    }
  });

  describe('should be able to resolve directory path based on the workspace layout', () => {
    test.each`
      directory               | expectedHostProjectName | expectedRemoteProjectName | hostProjectRoot                  | remoteProjectRoot
      ${'/frontend'}          | ${'frontend-myhostapp'} | ${'frontend-remote1'}     | ${'apps/frontend/myhostapp'}     | ${'apps/frontend/remote1'}
      ${'apps'}               | ${'myhostapp'}          | ${'remote1'}              | ${'apps/myhostapp'}              | ${'apps/remote1'}
      ${'/apps/frontend'}     | ${'frontend-myhostapp'} | ${'frontend-remote1'}     | ${'apps/frontend/myhostapp'}     | ${'apps/frontend/remote1'}
      ${'apps/frontend'}      | ${'frontend-myhostapp'} | ${'frontend-remote1'}     | ${'apps/frontend/myhostapp'}     | ${'apps/frontend/remote1'}
      ${'/packages'}          | ${'myhostapp'}          | ${'remote1'}              | ${'packages/myhostapp'}          | ${'packages/remote1'}
      ${'/packages/frontend'} | ${'frontend-myhostapp'} | ${'frontend-remote1'}     | ${'packages/frontend/myhostapp'} | ${'packages/frontend/remote1'}
    `(
      'when directory is "$directory" should generate "$expectedHostProjectName" and "$expectedRemoteProjectName" with projects\' roots at "$hostProjectRoot" and "$remoteProjectRoot"',
      async ({
        directory,
        expectedHostProjectName,
        expectedRemoteProjectName,
        hostProjectRoot,
        remoteProjectRoot,
      }) => {
        await generator(appTree, { ...options, directory });

        const hostConfig = readProjectConfiguration(
          appTree,
          expectedHostProjectName
        );

        expect(hostConfig.root).toBe(hostProjectRoot);
        expect(hostConfig).toMatchSnapshot(
          JSON.stringify(directory, expectedHostProjectName)
        );
        const remoteConfig = readProjectConfiguration(
          appTree,
          expectedRemoteProjectName
        );

        expect(remoteConfig.root).toBe(remoteProjectRoot);
        expect(remoteConfig).toMatchSnapshot(
          JSON.stringify(directory, expectedRemoteProjectName)
        );
      }
    );
  });
});
