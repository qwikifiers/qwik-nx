export interface E2eProjectGeneratorSchema {
  project: string;
  e2eTestRunner: 'playwright' | 'cypress';
  directory?: string;
  skipFormat?: boolean;
}

export interface NormalizedSchema extends E2eProjectGeneratorSchema {
  e2eProjectName: string;
  projectRoot: string;
  projectDirectory: string;
}
