import { Linter } from '@nx/linter';

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
  // router: 'qwik-city' | 'none'; // TODO: add setup w/o qwik-city
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
}
