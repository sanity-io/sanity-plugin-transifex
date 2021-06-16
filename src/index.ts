import TranslationTab from './components/TranslationTab'
import {
  BaseDocumentDeserializer,
  BaseDocumentSerializer,
  BaseDocumentPatcher,
  defaultStopTypes,
  customSerializers,
} from './serialization'
import { TransifexAdapter } from './transifexAdapter'
export {
  TranslationTab,
  BaseDocumentDeserializer,
  BaseDocumentSerializer,
  BaseDocumentPatcher,
  defaultStopTypes,
  customSerializers,
  TransifexAdapter,
}

export const defaultDocumentLevelConfig = {
	exportForTranslation: (id: string) => BaseDocumentSerializer.serializeDocument(
	id, 'document', 'en', defaultStopTypes, customSerializers),
	importTranslation: (id: string, localeId: string, document: string) => {
		return BaseDocumentDeserializer.deserializeDocument(id, document).then(
			(deserialized: Record<string, any>) => (
				BaseDocumentPatcher.documentLevelPatch(deserialized, id, localeId)
			))
	},
	adapter: TransifexAdapter
}


export const defaultFieldLevelConfig = {
	exportForTranslation: (id: string) => BaseDocumentSerializer.serializeDocument(
	id, 'field', 'en', defaultStopTypes, customSerializers),
	importTranslation: (id: string, localeId: string, document: string) => {
		return BaseDocumentDeserializer.deserializeDocument(id, document).then(
			(deserialized: Record<string, any>) => (
				BaseDocumentPatcher.fieldLevelPatch(deserialized, id, localeId, 'en')
			))
	},
	adapter: TransifexAdapter
}

