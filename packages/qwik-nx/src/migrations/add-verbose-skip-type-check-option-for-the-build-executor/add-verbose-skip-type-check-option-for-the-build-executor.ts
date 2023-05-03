import { Tree, getProjects, updateProjectConfiguration } from '@nx/devkit';
import { isQwikNxProject } from '../../utils/migrations';

export default function update(host: Tree) {
  const projects = getProjects(host);

  projects.forEach((config, name) => {
    if (isQwikNxProject(config)) {
      const buildTarget = config.targets?.['build'];
      if (buildTarget?.options) {
        buildTarget.options = {
          ...buildTarget.options,
          skipTypeCheck: false,
        };
        updateProjectConfiguration(host, name, config);
      }
    }
  });
}
