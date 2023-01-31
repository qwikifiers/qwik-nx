import { Linter } from '@nrwl/linter';

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
  // router: 'qwik-city' | 'none'; // TODO: add setup w/o qwik-city
}

export interface NormalizedSchema extends QwikAppGeneratorSchema {
  projectName: string;
  projectRoot: string;
  offsetFromRoot: string;
  rootTsConfigPath: string;
  setupVitest: boolean;
  parsedTags: string[];
  styleExtension: Exclude<QwikAppGeneratorSchema['style'], 'none'> | null;
}
