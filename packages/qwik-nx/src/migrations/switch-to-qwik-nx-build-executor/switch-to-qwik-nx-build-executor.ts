import {
  getProjects,
  ProjectConfiguration,
  TargetConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';

export default function update(host: Tree) {
  const projects = getProjects(host);

  projects.forEach((config, name) => {
    if (isQwikNxProject(config)) {
      // rename targets
      config.targets['build.client'] = config.targets['build'];
      config.targets['build.ssr'] = config.targets['build-ssr'];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete config.targets['build-ssr'];
      if (config.targets['serveDebug']) {
        config.targets['serve.debug'] = config.targets['serveDebug'];
        delete config.targets['serveDebug'];
      }

      // add new build target
      config.targets.build = {
        executor: 'qwik-nx:build',
        options: {
          runSequence: [`${name}:build.client`, `${name}:build.ssr`],
          outputPath:
            config.targets['build.client'].options['outputPath'] ??
            `dist/${config.root}`,
        },
        configurations: { preview: {} },
      };

      // update buildTarget for the serve target and its configurations
      const serveTarget = config.targets['serve'];
      if (serveTarget) {
        // using "split" because target can be specified w\ or w\o configuration
        serveTarget.options['buildTarget'] = config.targets['serve'].options[
          'buildTarget'
        ]
          ?.split(':')
          .map((part: string) => (part === 'build' ? 'build.client' : part))
          .join(':');
        Object.keys(serveTarget.configurations ?? {}).forEach(
          (configurationName) => {
            const cfg = serveTarget.configurations![configurationName];
            cfg.buildTarget = cfg.buildTarget
              ?.split(':')
              .map((part: string) => (part === 'build' ? 'build.client' : part))
              .join(':');
          }
        );
      }

      // update dependsOn
      config.targets['build.ssr'].dependsOn = config.targets[
        'build.ssr'
      ].dependsOn?.filter((target) => target !== 'build');
      config.targets['preview'].dependsOn = config.targets[
        'preview'
      ].dependsOn?.map((target) => (target === 'build-ssr' ? 'build' : target));

      // update intermediate target for cloudflare if it exists
      const cfTargetOptions =
        config.targets['build-ssr-cloudflare-pages']?.options;
      if (cfTargetOptions?.command) {
        cfTargetOptions.command = cfTargetOptions.command.replace(
          'build-ssr:cloudflare-pages',
          'build:cloudflare-pages'
        );

        // add configuration in the build command for cloudflare pages if it does not exist
        (config.targets.build.configurations ??= {})['cloudflare-pages'] ??= {};
      }

      updateProjectConfiguration(host, name, config);
    }
  });
}

function isQwikNxProject(
  config: ProjectConfiguration
): config is OldQwikNxConfiguration {
  if (config.targets?.['build']?.executor !== '@nx/vite:build') {
    return false;
  }
  if (config.targets['build-ssr']?.executor !== '@nx/vite:build') {
    return false;
  }
  if (!config.targets['preview']) {
    return false;
  }
  return true;
}

type OldQwikNxConfiguration = ProjectConfiguration & {
  targets: Record<'build' | 'build-ssr' | 'preview', TargetConfiguration>;
};
