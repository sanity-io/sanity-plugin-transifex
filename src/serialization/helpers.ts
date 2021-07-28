import sanityClient from 'part:@sanity/base/client'
import { SanityDocument } from '@sanity/types'

const client = sanityClient.withConfig({ apiVersion: 'v1' })

export const findLatestDraft = (documentId: string) => {
  const query = `*[_id match $id && (_id in path("drafts.*") || _id in path("*"))]`
  const params = { id: documentId }
  return client
    .fetch(query, params)
    .then(
      (docs: SanityDocument[]) =>
        docs.find(doc => doc._id.includes('draft')) ?? docs[0]
    )
}
