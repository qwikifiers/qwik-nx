import { Linter } from '@nrwl/linter';

export interface LibraryGeneratorSchema {
  name: string;
  directory?: string;
  skipFormat?: boolean;
  style?: 'css' | 'scss' | 'styl' | 'less' | 'none';
  tags?: string;
  unitTestRunner?: 'vitest' | 'none';
  linter?: Linter;
  importPath?: string;
  strict?: boolean;
  buildable?: boolean;
  standaloneConfig?: boolean;
}

type NormalizedRequiredPropsNames =
  | 'style'
  | 'unitTestRunner'
  | 'linter'
  | 'buildable';
type NormalizedRequiredProps = Required<
  Pick<LibraryGeneratorSchema, NormalizedRequiredPropsNames>
>;

export type NormalizedSchema = Omit<
  LibraryGeneratorSchema,
  NormalizedRequiredPropsNames
> &
  NormalizedRequiredProps & {
    projectName: string;
    projectRoot: string;
    projectDirectory: string;
    parsedTags: string[];
    offsetFromRoot: string;
    setupVitest: boolean;
    buildable: boolean;
  };
