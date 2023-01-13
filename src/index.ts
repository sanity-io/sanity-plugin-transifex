import {
  TranslationsTab,
  baseDocumentLevelConfig,
  baseFieldLevelConfig,
  findLatestDraft,
  BaseDocumentDeserializer,
  BaseDocumentSerializer,
  BaseDocumentMerger,
  defaultStopTypes,
  customSerializers,
  Adapter,
  documentLevelPatch,
  fieldLevelPatch,
} from 'sanity-translations-tab'
import { TransifexAdapter } from './transifexAdapter'

/**
 * @public
 */
export interface ConfigOptions {
  adapter: Adapter
  secretsNamespace: string | null
  exportForTranslation: (id: string) => Promise<Record<string, any>>
  importTranslation: (
    id: string,
    localeId: string,
    doc: string,
    idStructure?: "subpath" | "delimiter" | undefined
  ) => Promise<void>
  idStructure?: string
}

/**
 * @public
 */
const defaultDocumentLevelConfig: ConfigOptions = {
  ...baseDocumentLevelConfig,
  adapter: TransifexAdapter,
  secretsNamespace: 'transifex',
}

/**
 * @public
 */
const defaultFieldLevelConfig: ConfigOptions = {
  ...baseFieldLevelConfig,
  adapter: TransifexAdapter,
  secretsNamespace: 'transifex',
}

export {
  TranslationsTab,
  findLatestDraft,
  documentLevelPatch,
  fieldLevelPatch,
  BaseDocumentDeserializer,
  BaseDocumentSerializer,
  BaseDocumentMerger,
  defaultStopTypes,
  customSerializers,
  TransifexAdapter,
  defaultDocumentLevelConfig,
  defaultFieldLevelConfig,
}
