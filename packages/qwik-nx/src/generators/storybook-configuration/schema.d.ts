import { Linter } from '@nrwl/linter';

export interface StorybookConfigurationGeneratorSchema {
  name: string;
  linter?: Linter;
  js?: boolean;
  tsConfiguration?: boolean;
  qwikCitySupport?: 'true' | 'false' | 'auto';
}

type NormalizedRequiredPropsNames = 'js' | 'linter' | 'tsConfiguration';
type NormalizedRequiredProps = Required<
  Pick<StorybookConfigurationGeneratorSchema, NormalizedRequiredPropsNames>
>;

export type NormalizedSchema = Omit<
  StorybookConfigurationGeneratorSchema,
  NormalizedRequiredPropsNames
> &
  NormalizedRequiredProps & {
    qwikCitySupportInternal: boolean;
  };
