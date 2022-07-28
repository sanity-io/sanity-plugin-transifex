import { Secrets } from 'sanity-translations-tab'

export const baseTransifexUrl = 'https://rest.api.transifex.com'

export const getHeaders = (secrets: Secrets | null) => ({
  Authorization: `Bearer ${secrets?.token}`,
  'Content-Type': 'application/vnd.api+json',
})

export const projOrgSlug = (secrets: Secrets | null) =>
  `o:${secrets?.organization}:p:${secrets?.project}`
