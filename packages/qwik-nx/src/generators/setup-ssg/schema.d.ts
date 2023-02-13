export interface SetupSsgGeneratorSchema {
  project: string;
}

interface NormalizedSchema extends SetupSsgGeneratorSchema {
  projectRoot: string;
}
