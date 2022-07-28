import { Secrets } from 'sanity-translations-tab'
import { baseTransifexUrl, projOrgSlug, getHeaders } from './helpers'

export default async function getLocales(secrets: Secrets | null) {
  if (secrets) {
    return fetch(
      `${baseTransifexUrl}/projects/${projOrgSlug(secrets)}/languages`,
      { headers: getHeaders(secrets) }
    )
      .then(res => res.json())
      .then(res =>
        res.data.map((lang: Record<string, any>) => ({
          enabled: true,
          description: lang.attributes.name,
          localeId: lang.attributes.code,
        }))
      )
  } else {
    return []
  }
}
