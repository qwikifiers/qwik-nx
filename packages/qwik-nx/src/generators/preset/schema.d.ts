export interface QwikWorkspacePresetGeneratorSchema {
  name: string;
  qwikAppName: string;
  tags?: string;
  directory?: string;

  style: 'css' | 'scss' | 'styl' | 'less' | 'none';
  qwikAppStyle: 'css' | 'scss' | 'styl' | 'less' | 'none';
  linter: 'eslint' | 'none';
  skipFormat: boolean;
  unitTestRunner: 'vitest' | 'none';
  strict: boolean;
}
