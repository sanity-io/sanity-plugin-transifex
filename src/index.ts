import { TranslationsTab } from 'sanity-translations-tab'
import {
  BaseDocumentDeserializer,
  BaseDocumentSerializer,
  BaseDocumentMerger,
  defaultStopTypes,
  customSerializers,
} from 'sanity-naive-html-serializer'
import { TransifexAdapter } from './transifexAdapter'
import { findLatestDraft, documentLevelPatch, fieldLevelPatch } from './helpers'
import { SanityDocument } from '@sanity/types'

const defaultDocumentLevelConfig = {
  exportForTranslation: async (id: string) => {
    const doc = await findLatestDraft(id)
    const serialized = BaseDocumentSerializer.serializeDocument(doc, 'document')
    serialized.name = id
    return serialized
  },
  importTranslation: (id: string, localeId: string, document: string) => {
    const deserialized = BaseDocumentDeserializer.deserializeDocument(
      document
    ) as SanityDocument
    documentLevelPatch(id, deserialized, localeId)
  },
  adapter: TransifexAdapter,
  secretsNamespace: 'transifex',
}

const defaultFieldLevelConfig = {
  exportForTranslation: async (id: string) => {
    const doc = await findLatestDraft(id)
    const serialized = BaseDocumentSerializer.serializeDocument(doc, 'field')
    serialized.name = id
    return serialized
  },
  importTranslation: (id: string, localeId: string, document: string) => {
    const deserialized = BaseDocumentDeserializer.deserializeDocument(
      document
    ) as SanityDocument
    fieldLevelPatch(id, deserialized, localeId)
  },
  adapter: TransifexAdapter,
  secretsNamespace: 'transifex',
}

export {
  TranslationsTab,
  BaseDocumentDeserializer,
  BaseDocumentSerializer,
  BaseDocumentMerger,
  defaultStopTypes,
  customSerializers,
  TransifexAdapter,
  defaultDocumentLevelConfig,
  defaultFieldLevelConfig,
}
