import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration, readJson } from '@nrwl/devkit';

import generator from './generator';
import { HostGeneratorSchema } from './schema';

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
    expect(
      appTree.listChanges().map((c) => ({ path: c.path, type: c.type }))
    ).toMatchSnapshot();

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
});
