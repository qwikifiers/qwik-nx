import type { Linter } from '@nx/eslint';
import type { ProjectNameAndRootFormat } from '@nx/devkit/src/generators/project-name-and-root-utils';

export interface QwikAppGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  style?: 'css' | 'scss' | 'styl' | 'less' | 'none';
  linter?: Linter;
  skipFormat?: boolean;
  tailwind?: boolean;
  unitTestRunner?: 'vitest' | 'none';
  strict?: boolean;
  e2eTestRunner?: 'playwright' | 'cypress' | 'none';
  devServerPort?: number;
  previewServerPort?: number;
  projectNameAndRootFormat?: ProjectNameAndRootFormat;
}

export interface NormalizedSchema extends QwikAppGeneratorSchema {
  devServerPort: number;
  previewServerPort: number;
  projectName: string;
  projectRoot: string;
  offsetFromRoot: string;
  rootTsConfigPath: string;
  setupVitest: boolean;
  parsedTags: string[];
  styleExtension: Exclude<QwikAppGeneratorSchema['style'], 'none'> | null;
  projectNameAndRootFormat: ProjectNameAndRootFormat;
  e2eProjectName: string;
  e2eProjectRoot: string;
}
