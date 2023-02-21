import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration, readJson } from '@nrwl/devkit';

import { remoteGenerator } from './generator';
import { hostGenerator } from './../host/generator';
import { RemoteGeneratorSchema } from './schema';

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
    expect(
      appTree.listChanges().map((c) => ({ path: c.path, type: c.type }))
    ).toMatchSnapshot();
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
});
