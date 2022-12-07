import { Linter } from '@nrwl/linter';

export interface LibraryGeneratorSchema {
  name: string;
  directory?: string;
  skipFormat?: boolean;
  style?: 'css' | 'scss' | 'styl' | 'less' | 'none';
  tags?: string;
  unitTestRunner?: 'vitest' | 'none';
  linter?: Linter;
  importPath?: string;
  strict?: boolean;
  standaloneConfig?: boolean;
}
