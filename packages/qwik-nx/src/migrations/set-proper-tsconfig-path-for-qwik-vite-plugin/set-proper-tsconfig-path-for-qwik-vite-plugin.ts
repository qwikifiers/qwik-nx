import { Tree, getProjects } from '@nx/devkit';
import { isQwikNxProject } from '../../utils/migrations';
import { normalizeViteConfigFilePathWithTree } from '@nx/vite';
import { updateViteConfig } from '../../utils/update-vite-config';

export default function update(tree: Tree) {
  const projects = getProjects(tree);

  projects.forEach((config) => {
    if (isQwikNxProject(config)) {
      const viteConfigPath = normalizeViteConfigFilePathWithTree(
        tree,
        config.root
      );
      if (!viteConfigPath) {
        return;
      }
      const viteConfig = tree.read(viteConfigPath)!.toString();

      if (viteConfig.includes('tsconfigFileNames')) {
        // dummy check to ensure viteConfig does not have "tsconfigFileNames" property
        // name collisions are very unlikely here so it seems fine to not run AST checks for this
        return;
      }

      const updated = updateViteConfig(viteConfig, {
        qwikViteConfig: {
          tsconfigFileNames: JSON.stringify(['tsconfig.app.json']),
        },
      });
      tree.write(viteConfigPath, updated);
    }
  });
}
