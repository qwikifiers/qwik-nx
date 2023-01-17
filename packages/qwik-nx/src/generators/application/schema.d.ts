export interface QwikAppGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;

  style: 'css' | 'scss' | 'styl' | 'less' | 'none';
  linter: 'eslint' | 'none';
  skipFormat: boolean;
  tailwind?: boolean;
  unitTestRunner: 'vitest' | 'none';
  strict: boolean;
  e2eTestRunner: 'playwright' | 'cypress' | 'none';
  // router: 'qwik-city' | 'none'; // TODO: add setup w/o qwik-city
}
