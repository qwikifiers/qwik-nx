export interface DenoIntegrationGeneratorSchema {
  project: string;
  deployTarget: string;
  serveTarget: string;
  site?: string;
  skipFormat?: boolean;
  generateGithubHook?: boolean;
  denoProjectName?: string;
}
