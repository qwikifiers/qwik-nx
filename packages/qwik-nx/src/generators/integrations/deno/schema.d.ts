export interface DenoIntegrationGeneratorSchema {
  project: string;
  site?: string;
  skipFormat?: boolean;
  generateGithubHook?: boolean;
  denoProjectName?: string;
}
