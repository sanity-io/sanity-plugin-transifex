import { Secrets } from 'sanity-translations-tab'
import { baseTransifexUrl, getHeaders } from './helpers'

export default async function getTranslation(
  taskId: string,
  localeId: string,
  secrets: Secrets | null
) {
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

  const headers = getHeaders(secrets)
  const location = await pollForFileDownloadLocation(
    resourceDownloadUrl,
    translationDownloadId,
    headers
  )
  return handleFileDownload(location)
}

const pollForFileDownloadLocation = async (
  resourceDownloadUrl: string,
  translationDownloadId: string,
  headers: Record<string, any>
): Promise<string> => {
  const response = await fetch(
    `${resourceDownloadUrl}/${translationDownloadId}`,
    {
      headers: headers,
    }
  )

  if (response.status === 500) {
    console.info(
      `Transifex plugin message: Received 500 for translation download ID ${translationDownloadId}. Trying to reconnect...`
    )
    await new Promise(resolve => setTimeout(resolve, 3000))
    return pollForFileDownloadLocation(
      resourceDownloadUrl,
      translationDownloadId,
      headers
    )
  } else if (response.redirected) {
    console.info(
      `Transifex plugin message: Received redirect for translation download ID ${translationDownloadId}. Following redirect now for file download.`
    )
    return response.url
  } else if (response.status === 200) {
    console.info(
      `Transifex plugin message: Requested download location for translation download ID ${translationDownloadId}. Location is still pending, trying again.`
    )
    await new Promise(resolve => setTimeout(resolve, 3000))
    return pollForFileDownloadLocation(
      resourceDownloadUrl,
      translationDownloadId,
      headers
    )
  } else {
    console.info(
      `Transifex plugin message: Requested download location for translation download ID ${translationDownloadId} but received error code ${response.status}. Waiting and trying again.`
    )
    await new Promise(resolve => setTimeout(resolve, 3000))
    return pollForFileDownloadLocation(
      resourceDownloadUrl,
      translationDownloadId,
      headers
    )
  }
}

const handleFileDownload = async (url: string) => {
  return fetch(url).then(res => res.text())
}
