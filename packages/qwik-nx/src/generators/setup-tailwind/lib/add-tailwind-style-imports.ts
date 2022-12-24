import {
  joinPathFragments,
  logger,
  ProjectConfiguration,
  stripIndents,
  Tree,
} from '@nrwl/devkit';

import { SetupTailwindOptions } from '../schema';

const knownLocations = ['src/global.css'];

export function addTailwindStyleImports(
  tree: Tree,
  project: ProjectConfiguration,
  _options: SetupTailwindOptions
) {
  const candidates = knownLocations.map((x) =>
    joinPathFragments(project.root, x)
  );
  const stylesPath = candidates.find((x) => tree.exists(x));

  if (stylesPath) {
    const content = tree.read(stylesPath).toString();
    tree.write(
      stylesPath,
      `@tailwind components;\n@tailwind base;\n@tailwind utilities;\n${content}`
    );
  } else {
    logger.warn(
      stripIndents`
        Could not find stylesheet to update. Add the following imports to your stylesheet (e.g. styles.css):

          @tailwind components;
          @tailwind base;
          @tailwind utilities;

        See our guide for more details: https://nx.dev/guides/using-tailwind-css-in-react`
    );
  }
}
