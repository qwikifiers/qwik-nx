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
  // router: 'qwik-city' | 'none'; // TODO: add setup w/o qwik-city
  // e2eTestRunner: "cypress" | "none"; // TODO: wait until this PR is merged https://github.com/nrwl/nx/pull/13474
}
