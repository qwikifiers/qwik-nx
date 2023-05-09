import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import {
  Tree,
  readProjectConfiguration,
  readJson,
  joinPathFragments,
} from '@nx/devkit';

import { remoteGenerator } from './generator';
import { hostGenerator } from './../host/generator';
import { RemoteGeneratorSchema } from './schema';
import { getFormattedListChanges } from '../../utils/testing-generators';

describe('remote generator', () => {
  let appTree: Tree;
  const options: RemoteGeneratorSchema = { name: 'myremote' };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should run successfully', async () => {
    await remoteGenerator(appTree, options);
    const config = readProjectConfiguration(appTree, 'myremote');
    expect(config).toBeDefined();
    expect(
      appTree.read('apps/myremote/vite.config.ts', 'utf-8')
    ).toMatchSnapshot();
    expect(
      appTree.read('apps/myremote/project.json', 'utf-8')
    ).toMatchSnapshot();
    expect(getFormattedListChanges(appTree)).toMatchSnapshot();
  });

  it('should update host config', async () => {
    await hostGenerator(appTree, { name: 'myhost' });

    expect(readJson(appTree, 'apps/myhost/src/config/remotes.json')).toEqual(
      {}
    );

    await remoteGenerator(appTree, { ...options, host: 'myhost', port: 777 });

    expect(readJson(appTree, 'apps/myhost/src/config/remotes.json')).toEqual({
      myremote: 'http://localhost:777',
    });
  });

  describe('should be able to resolve directory path based on the workspace layout', () => {
    test.each`
      directory               | expectedProjectName    | projectRoot
      ${'/frontend'}          | ${'frontend-myremote'} | ${'apps/frontend/myremote'}
      ${'apps'}               | ${'myremote'}          | ${'apps/myremote'}
      ${'/apps/frontend'}     | ${'frontend-myremote'} | ${'apps/frontend/myremote'}
      ${'apps/frontend'}      | ${'frontend-myremote'} | ${'apps/frontend/myremote'}
      ${'/packages'}          | ${'myremote'}          | ${'packages/myremote'}
      ${'/packages/frontend'} | ${'frontend-myremote'} | ${'packages/frontend/myremote'}
    `(
      'when directory is "$directory" should generate "$expectedProjectName" with project\'s root at "$projectRoot"',
      async ({ directory, expectedProjectName, projectRoot }) => {
        await remoteGenerator(appTree, { ...options, directory });

        const config = readProjectConfiguration(appTree, expectedProjectName);

        expect(config.root).toBe(projectRoot);
        expect(config).toMatchSnapshot(
          JSON.stringify(directory, expectedProjectName)
        );
        expect(
          appTree.exists(joinPathFragments(projectRoot, 'vite.config.ts'))
        ).toBeTruthy();
      }
    );
  });
});
