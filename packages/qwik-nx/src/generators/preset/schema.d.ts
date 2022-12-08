export interface QwikPresetGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;

  style: 'css' | 'scss' | 'styl' | 'less' | 'none';
  linter: 'eslint' | 'none';
  skipFormat: boolean;
  unitTestRunner: 'vitest' | 'none';
  strict: boolean;
}
