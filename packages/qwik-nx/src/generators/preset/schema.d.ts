import { Linter } from '@nx/linter';

export interface QwikWorkspacePresetGeneratorSchema
  extends QwikAppGeneratorSchema {
  name: string;
  qwikAppName: string;
  tags?: string;
  directory?: string;

  style: 'css' | 'scss' | 'styl' | 'less' | 'none';
  qwikAppStyle: 'css' | 'scss' | 'styl' | 'less' | 'none';
  linter: Linter;
  skipFormat: boolean;
  tailwind?: boolean;
  unitTestRunner: 'vitest' | 'none';
  strict: boolean;
  e2eTestRunner: 'playwright' | 'cypress' | 'none';
  devServerPort?: number;
  previewServerPort?: number;
}
