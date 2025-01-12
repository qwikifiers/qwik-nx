import { Linter } from '@nx/eslint';

export interface QwikWorkspacePresetGeneratorSchema {
  qwikAppName: string;
  qwikAppStyle?: 'css' | 'scss' | 'styl' | 'less' | 'none';
  linter?: Linter;
  unitTestRunner?: 'vitest' | 'none';
  e2eTestRunner?: 'playwright' | 'cypress' | 'none';
}
