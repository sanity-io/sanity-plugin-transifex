import { Adapter, TransifexSecrets } from './types'

const baseTransifexUrl = 'https://rest.api.transifex.com'
const getHeaders = (secrets: TransifexSecrets) => ({
  Authorization: `Bearer ${secrets.token}`,
  'Content-Type': 'application/vnd.api+json',
})
const projOrgSlug = (secrets: TransifexSecrets) =>
  `o:${secrets.organization}:p:${secrets.project}`

const getLocales = async (secrets: TransifexSecrets) => {
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

const getTranslationTask = async (
  documentId: string,
  secrets: TransifexSecrets
) => {
  const projectFilter = `filter[project]=${projOrgSlug(secrets)}`
  const resourceFilter = `filter[resource]=${projOrgSlug(
    secrets
  )}:r:${documentId}`
  const task = await fetch(
    `${baseTransifexUrl}/resource_language_stats?${projectFilter}&${resourceFilter}`,
    { headers: getHeaders(secrets) }
  )
    .then(res => {
      if (res.ok) {
        return res.json()
      }
      //normal -- just means that this task doesn't exist yet.
      else if (res.status === 404) {
        return { data: [] }
      } else {
        throw Error(
          `Failed to retrieve tasks from Transifex. Status: ${res.status}`
        )
      }
    })
    .then(res => ({
      taskId: `${projOrgSlug(secrets)}:r:${documentId}`,
      documentId: documentId,
      locales: res.data.map((locale: Record<string, any>) => ({
        localeId: locale.relationships.language.data.id.split(':')[1],
        progress: Math.floor(
          100 *
            (locale.attributes.translated_strings /
              parseFloat(locale.attributes.total_strings))
        ),
      })),
    }))

  const locales = await getLocales(secrets)
  const localeIds = locales.map((l: Record<string, any>) => l.localeId)
  const validLocales = task.locales.filter((locale: Record<string, any>) =>
    localeIds.find((id: string) => id === locale.localeId)
  )
  task.locales = validLocales

  return task
}

const createResource = async (
  doc: Record<string, any>,
  documentId: string,
  secrets: TransifexSecrets
) => {
  const resourceCreateBody = {
    data: {
      attributes: {
        accept_translations: true,
        name: doc.name,
        slug: documentId,
      },
      relationships: {
        i18n_format: {
          data: {
            id: 'HTML_FRAGMENT',
            type: 'i18n_formats',
          },
        },
        project: {
          data: {
            id: projOrgSlug(secrets),
            type: 'projects',
          },
        },
      },
      type: 'resources',
    },
  }

  return fetch(`${baseTransifexUrl}/resources`, {
    headers: getHeaders(secrets),
    method: 'POST',
    body: JSON.stringify(resourceCreateBody),
  })
    .then(res => res.json())
    .then(res => res.data.id)
}

const createTask = async (
  documentId: string,
  document: Record<string, any>,
  secrets: TransifexSecrets
) => {
  let resourceId = await fetch(
    `${baseTransifexUrl}/resources/${projOrgSlug(secrets)}:r:${documentId}`,
    { headers: getHeaders(secrets) }
  )
    .then(res => res.json())
    .then(res => (res.data ? res.data.id : null))

  if (!resourceId) {
    resourceId = await createResource(document, documentId, secrets)
  }

  const resourceUploadUrl = `${baseTransifexUrl}/resource_strings_async_uploads`
  const resourceUploadBody = {
    data: {
      attributes: {
        content: document.content,
        content_encoding: 'text',
      },
      relationships: {
        resource: {
          data: {
            id: resourceId,
            type: 'resources',
          },
        },
      },
      type: 'resource_strings_async_uploads',
    },
  }

  return fetch(resourceUploadUrl, {
    method: 'POST',
    body: JSON.stringify(resourceUploadBody),
    headers: getHeaders(secrets),
  }).then(() => getTranslationTask(documentId, secrets))
}

const getTranslation = async (
  taskId: string,
  localeId: string,
  secrets: TransifexSecrets
) => {
  const resourceDownloadBody = {
    data: {
      attributes: {
        content_encoding: 'text',
      },
      relationships: {
        language: {
          data: {
            id: `l:${localeId}`,
            type: 'languages',
          },
        },
        resource: {
          data: {
            id: taskId,
            type: 'resources',
          },
        },
      },
      type: 'resource_translations_async_downloads',
    },
  }

  const resourceDownloadUrl = `${baseTransifexUrl}/resource_translations_async_downloads`
  const translationDownloadId = await fetch(resourceDownloadUrl, {
    headers: getHeaders(secrets),
    method: 'POST',
    body: JSON.stringify(resourceDownloadBody),
  })
    .then(res => res.json())
    .then(res => res.data.id)

  return new Promise(resolve => {
    setTimeout(function() {
      fetch(`${resourceDownloadUrl}/${translationDownloadId}`, {
        headers: getHeaders(secrets),
      }).then(res => {
        if (res.redirected) {
          return resolve(handleFileDownload(res.url))
        } else {
          return res.json()
        }
      })
    }, 3000)
  })
}

const handleFileDownload = async (url: string) => {
  return fetch(url).then(res => res.text())
}

export const TransifexAdapter: Adapter = {
  getLocales,
  getTranslationTask,
  createTask,
  getTranslation,
}
