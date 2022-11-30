import {
  addDependenciesToPackageJson,
  GeneratorCallback,
  Tree,
} from '@nrwl/devkit';
import { lessVersion, sassVersion, stylusVersion } from './versions';

type PackageDependencies = Record<
  'dependencies' | 'devDependencies',
  Record<string, string>
>;

export function addStyledModuleDependencies(
  host: Tree,
  styledModule: string
): GeneratorCallback {
  const extraDependencies = STYLE_DEPENDENCIES.get(styledModule);

  if (extraDependencies) {
    return addDependenciesToPackageJson(
      host,
      extraDependencies.dependencies,
      extraDependencies.devDependencies
    );
  } else {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  }
}

const STYLE_DEPENDENCIES = new Map<string, PackageDependencies>([
  [
    'scss',
    {
      dependencies: {},
      devDependencies: {
        sass: sassVersion,
      },
    },
  ],
  [
    'less',
    {
      dependencies: {},
      devDependencies: {
        less: lessVersion,
      },
    },
  ],
  [
    'styl',
    {
      dependencies: {},
      devDependencies: {
        stylus: stylusVersion,
      },
    },
  ],
]);
