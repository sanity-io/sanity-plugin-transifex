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
  ExportForTranslation,
  ImportTranslation,
} from 'sanity-translations-tab'
import { TransifexAdapter } from './transifexAdapter'

interface ConfigOptions {
  adapter: Adapter
  secretsNamespace: string | null
  exportForTranslation: ExportForTranslation
  importTranslation: ImportTranslation
}
const defaultDocumentLevelConfig: ConfigOptions = {
  ...baseDocumentLevelConfig,
  adapter: TransifexAdapter,
  secretsNamespace: 'transifex',
}

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
