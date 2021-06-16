import React from 'react'

import { Adapter, TransifexSecrets } from '../types'

export type ContextProps = {
  documentId: string
  adapter: Adapter
  importTranslation: (
    languageId: string,
    document: Record<string, any>
  ) => Promise<void>
  exportForTranslation: (documentId: string) => Promise<Record<string, any>>
  baseLanguage: string
  transifexSecrets: TransifexSecrets
}

export const TranslationContext = React.createContext<ContextProps | null>(null)
