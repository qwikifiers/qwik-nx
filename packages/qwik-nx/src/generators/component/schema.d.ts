export interface ComponentGeneratorSchema {
  name: string;
  project: string;
  directory?: string;
  style?: 'none' | 'css' | 'scss' | 'styl' | 'less';
  skipTests?: boolean;
  flat?: boolean;
  exportDefault?: boolean;
  generateStories?: boolean;
}
