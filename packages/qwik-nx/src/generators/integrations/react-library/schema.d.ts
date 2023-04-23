import { LibraryGeneratorSchema } from '../../library/schema';

export type ReactLibraryGeneratorSchema = Omit<
  LibraryGeneratorSchema,
  'style'
> & {
  installMUIExample?: boolean;
  targetApps?: string | string[];
};
