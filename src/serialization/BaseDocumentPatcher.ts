import { findLatestDraft } from './helpers'
import sanityClient from 'part:@sanity/base/client'
import { SanityDocument } from '@sanity/types'
import { Patcher } from '../types'

const client = sanityClient.withConfig({ apiVersion: '2021-03-25' })

const fieldLevelPatch = (
  translatedFields: Record<string, any>,
  documentId: string,
  localeId: string,
  baseLang: string = 'en'
) => {
  return findLatestDraft(documentId).then((doc: Record<string, any>) => {
    const merged: Record<string, any> = {}

    for (let field in translatedFields) {
      const translatedVal = translatedFields[field][baseLang]
      const origVal = doc[field][baseLang]

      merged[field] = doc[field]
      let valToPatch
      if (typeof translatedVal === 'string') {
        valToPatch = translatedVal
      } else if (Array.isArray(translatedVal)) {
        valToPatch = reconcileArray(origVal ?? [], translatedVal)
      } else {
        valToPatch = reconcileObject(origVal ?? {}, translatedVal)
      }
      merged[field][localeId] = valToPatch
    }

    client
      .patch(doc._id)
      .set(merged)
      .commit()
  })
}

const documentLevelPatch = (
  translatedFields: Record<string, any>,
  documentId: string,
  localeId: string
) => {
  /* try whatever existing draft of this doc exists first --
   *  If user has created the i18n version, use that. If not,
   *  make it from the existing draft
   */
  return findLatestDraft(`i18n.${documentId}.${localeId}`)
    .then((doc: SanityDocument) => {
      if (!doc) {
        return findLatestDraft(documentId)
      } else {
        return doc
      }
    })
    .then((doc: SanityDocument) => {
      const merged = reconcileObject(doc, translatedFields)
      merged._id = `drafts.i18n.${documentId}.${localeId}`
      merged._lang = localeId
      client.createOrReplace(merged)
    })
}

const reconcileArray = (origArray: any[], translatedArray: any[]) => {
  //deep copy needed for field level patching
  const combined = JSON.parse(JSON.stringify(origArray))
  translatedArray.forEach(block => {
    if (!block._key) {
      return
    }
    const foundBlockIdx = origArray.findIndex(
      origBlock => origBlock._key === block._key
    )
    if (foundBlockIdx < 0) {
      console.log(
        `This block no longer exists on the original document. Was it removed? ${block._key}`
      )
    } else if (
      origArray[foundBlockIdx]._type === 'block' ||
      origArray[foundBlockIdx]._type === 'span'
    ) {
      combined[foundBlockIdx] = block
    } else if (Array.isArray(origArray[foundBlockIdx])) {
      combined[foundBlockIdx] = reconcileArray(origArray[foundBlockIdx], block)
    } else {
      combined[foundBlockIdx] = reconcileObject(origArray[foundBlockIdx], block)
    }
  })
  return combined
}

const reconcileObject = (
  origObject: Record<string, any>,
  translatedObject: Record<string, any>
) => {
  const updatedObj = JSON.parse(JSON.stringify(origObject))
  Object.entries(translatedObject).forEach(([key, value]) => {
    if (!value || key[0] === '_') {
      return
    }
    if (typeof value === 'string') {
      updatedObj[key] = value
    } else if (Array.isArray(value)) {
      updatedObj[key] = reconcileArray(origObject[key] ?? [], value)
    } else {
      updatedObj[key] = reconcileObject(origObject[key] ?? {}, value)
    }
  })
  return updatedObj
}

export const BaseDocumentPatcher: Patcher = {
  fieldLevelPatch,
  documentLevelPatch,
  reconcileArray,
  reconcileObject,
}
