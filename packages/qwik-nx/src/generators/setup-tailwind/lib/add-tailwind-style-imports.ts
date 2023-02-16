import {
  joinPathFragments,
  logger,
  ProjectConfiguration,
  stripIndents,
  Tree,
} from '@nrwl/devkit';

const knownLocations = [
  'src/global.css',
  'src/global.scss',
  'src/global.styl',
  'src/global.less',
];

export function addTailwindStyleImports(
  tree: Tree,
  project: ProjectConfiguration
) {
  const candidates = knownLocations.map((x) =>
    joinPathFragments(project.root, x)
  );
  const stylesPath = candidates.find((x) => tree.exists(x));

  if (stylesPath) {
    const content = tree.read(stylesPath)?.toString();
    content &&
      tree.write(
        stylesPath,
        `@tailwind components;\n@tailwind base;\n@tailwind utilities;\n${content}`
      );
  } else {
    logger.warn(
      stripIndents`
        Could not find stylesheet to update. Add the following imports to your stylesheet (e.g. global.css):

          @tailwind components;
          @tailwind base;
          @tailwind utilities;`
    );
  }
}
