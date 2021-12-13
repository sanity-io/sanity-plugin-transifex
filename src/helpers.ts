import { SanityDocument } from '@sanity/types'
import sanityClient from 'part:@sanity/base/client'
import { BaseDocumentMerger } from 'sanity-naive-html-serializer'

const client = sanityClient.withConfig({ apiVersion: '2021-03-25' })

//document fetch
export const findLatestDraft = (documentId: string, ignoreI18n = true) => {
  //eliminates i18n versions
  const query = `*[_id match $id ${
    ignoreI18n ? ' && (_id in path("drafts.*") || _id in path("*"))' : ''
  }]`
  const params = { id: `*${documentId}` }
  return client
    .fetch(query, params)
    .then(
      (docs: SanityDocument[]) =>
        docs.find(doc => doc._id.includes('draft')) ?? docs[0]
    )
}

//revision fetch
export const findDocumentAtRevision = async (
  documentId: string,
  rev: string
) => {
  const dataset = client.config().dataset
  let baseUrl = `/data/history/${dataset}/documents/${documentId}?revision=${rev}`
  let url = client.getUrl(baseUrl)
  let revisionDoc = await fetch(url, { credentials: 'include' })
    .then(req => req.json())
    .then(req => req.documents[0])
  /* endpoint will silently give you incorrect doc
   * if you don't request draft and the rev belongs to a draft, so check
   */
  if (!revisionDoc || revisionDoc._rev !== rev) {
    baseUrl = `/data/history/${dataset}/documents/drafts.${documentId}?revision=${rev}`
    url = client.getUrl(baseUrl)
    revisionDoc = await fetch(url, { credentials: 'include' })
      .then(req => req.json())
      .then(req => req.documents[0])
  }
  return revisionDoc
}

//document-level patch
export const documentLevelPatch = async (
  documentId: string,
  translatedFields: SanityDocument,
  localeId: string
) => {
  let baseDoc: SanityDocument
  if (translatedFields._rev) {
    baseDoc = await findDocumentAtRevision(documentId, translatedFields._rev)
  } else {
    baseDoc = await findLatestDraft(documentId)
  }

  const merged = BaseDocumentMerger.documentLevelMerge(
    translatedFields,
    baseDoc
  )
  const targetId = `i18n.${documentId}.${localeId}`
  const i18nDoc = await findLatestDraft(targetId, false)

  if (i18nDoc) {
    const cleanedMerge: Record<string, any> = {}
    //don't overwrite any existing values on the i18n doc
    Object.entries(merged).forEach(([key, value]) => {
      if (
        Object.keys(translatedFields).includes(key) &&
        !['_id', '_rev', '_updatedAt'].includes(key)
      ) {
        cleanedMerge[key] = value
      }
    })
    client
      .transaction()
      //@ts-ignore
      .patch(i18nDoc._id, p => p.set(cleanedMerge))
      .commit()
  } else {
    merged._id = `drafts.${targetId}`
    //account for legacy implementations of i18n plugin lang
    if (baseDoc._lang) {
      merged._lang = localeId
    } else if (baseDoc.__i18n_lang) {
      merged.__i18n_lang = localeId
    }
    client.create(merged)
  }
}

//field level patch
export const fieldLevelPatch = async (
  documentId: string,
  translatedFields: SanityDocument,
  localeId: string
) => {
  let baseDoc: SanityDocument
  if (translatedFields._rev) {
    baseDoc = await findDocumentAtRevision(documentId, translatedFields._rev)
  } else {
    baseDoc = await findLatestDraft(documentId)
  }
  const merged = BaseDocumentMerger.fieldLevelMerge(
    translatedFields,
    baseDoc,
    localeId,
    'en'
  )
  client
    .patch(baseDoc._id)
    .set(merged)
    .commit()
}
