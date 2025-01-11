/* eslint-disable @typescript-eslint/no-unused-vars */
import { getProjects, Tree } from '@nx/devkit';
import { isQwikNxProject } from '../utils/migrations';
import { normalizeViteConfigFilePathWithTree } from '@nx/vite';
import { updateViteConfig } from '../utils/update-vite-config';

export default function update(host: Tree) {
  const projects = getProjects(host);

  projects.forEach((config) => {
    if (isQwikNxProject(config)) {
      const viteConfigPath = normalizeViteConfigFilePathWithTree(
        host,
        config.root
      );
      if (!viteConfigPath) {
        return;
      }
      const viteConfig = host.read(viteConfigPath)!.toString();

      const updated = updateViteConfig(viteConfig, {
        viteConfig: {
          root: config.root,
        },
      });
      host.write(viteConfigPath, updated);
    }
  });
}
