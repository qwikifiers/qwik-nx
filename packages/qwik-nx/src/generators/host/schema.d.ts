import { Linter } from '@nx/linter';

export interface HostGeneratorSchema {
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
  port?: number;
  remotes?: string[];
}
