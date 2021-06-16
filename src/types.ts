import { ObjectField, ObjectSchemaType, BlockSchemaType } from '@sanity/types'

export type TranslationTask = {
  taskId: string
  documentId: string
  locales: TranslationTaskLocaleStatus[]
}

export type TranslationLocale = {
  localeId: string
  description: string
  enabled?: boolean
}

export type TranslationTaskLocaleStatus = {
  localeId: string
  progress: number
}

export type TransifexSecrets = {
  organization: string
  project: string
  token: string
}

export interface Adapter {
  getLocales: (secrets: TransifexSecrets) => Promise<TranslationLocale[]>
  getTranslationTask: (
    documentId: string,
    secrets: TransifexSecrets
  ) => Promise<TranslationTask | null>
  createTask: (
    documentId: string,
    document: Record<string, any>,
    secrets: TransifexSecrets
  ) => Promise<TranslationTask>
  getTranslation: (
    taskid: string,
    localeId: string,
    secrets: TransifexSecrets
  ) => Promise<any | null>
}

export type SerializedDocument = {
  name: string
  content: string
}

export interface Serializer {
  serializeDocument: (
    documentId: string,
    translationLevel: string,
    baseLang: string,
    stopTypes: string[],
    serializers: Record<string, any>
  ) => Promise<SerializedDocument>
  fieldFilter: (
    obj: Record<string, any>,
    objFields: ObjectField[],
    stopTypes: string[]
  ) => Record<string, any>
  languageObjectFieldFilter: (
    obj: Record<string, any>,
    baseLang: string
  ) => Record<string, any>
  serializeArray: (
    fieldContent: Record<string, any>[],
    fieldName: string,
    stopTypes: string[],
    serializers: Record<string, any>
  ) => string
  serializeObject: (
    obj: Record<string, any>,
    topFieldName: string | null,
    stopTypes: string[],
    serializers: Record<string, any>
  ) => string
}

export interface Deserializer {
  deserializeDocument: (
    documentId: string,
    serializedDoc: string
  ) => Record<string, any>
  deserializeHTML: (
    html: string,
    target: ObjectSchemaType | BlockSchemaType,
    deserializers: Record<string, any>,
    blockDeserializers: Array<any>
  ) => Record<string, any> | any[]
}

export interface Patcher {
  fieldLevelPatch: (
    translatedFields: Record<string, any>,
    documentId: string,
    localeId: string,
    baseLang: string
  ) => Promise<void>
  documentLevelPatch: (
    translatedFields: Record<string, any>,
    documentId: string,
    localeId: string
  ) => Promise<void>
  reconcileArray: (origArray: any[], translatedArray: any[]) => any[]
  reconcileObject: (
    origObject: Record<string, any>,
    translatedObject: Record<string, any>
  ) => Record<string, any>
}
