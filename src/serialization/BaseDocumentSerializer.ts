import schemas from 'part:@sanity/base/schema'
import blocksToHtml, { h } from '@sanity/block-content-to-html'
import { defaultStopTypes, customSerializers } from './BaseSerializationConfig'
import { ObjectField } from '@sanity/types'
import { findLatestDraft } from './helpers'
import { Serializer } from '../types'

const getSchema = (name: string) =>
  schemas._original.types.find((s: ObjectField) => s.name === name)

const serializeDocument = async (
  documentId: string,
  translationLevel: string = 'document',
  baseLang: string = 'en',
  stopTypes: string[] = defaultStopTypes,
  serializers: Record<string, any> = customSerializers
) => {
  const doc = await findLatestDraft(documentId)

  let filteredObj: Record<string, any> = {}

  if (translationLevel === 'field') {
    filteredObj = languageObjectFieldFilter(doc, baseLang)
  } else {
    filteredObj = fieldFilter(doc, getSchema(doc._type).fields, stopTypes)
  }

  const serializedFields: Record<string, any> = {}
  for (let key in filteredObj) {
    const value: Record<string, any> | Array<any> = filteredObj[key]
    if (typeof value === 'string') {
      serializedFields[key] = value
    } else if (Array.isArray(value)) {
      serializedFields[key] = serializeArray(value, key, stopTypes, serializers)
    } else {
      serializedFields[key] = serializeObject(
        value,
        key,
        stopTypes,
        serializers
      )
    }
  }

  return {
    name: documentId,
    content: serializeObject(
      serializedFields,
      doc._type,
      stopTypes,
      serializers
    ),
  }
}

const languageObjectFieldFilter = (
  obj: Record<string, any>,
  baseLang: string
) => {
  const filteredObj: Record<string, any> = {}
  for (let key in obj) {
    const value: any = obj[key]
    if (value.hasOwnProperty(baseLang)) {
      filteredObj[key] = {}
      filteredObj[key][baseLang] = value[baseLang]
    }
  }

  return filteredObj
}

const fieldFilter = (
  obj: Record<string, any>,
  objFields: ObjectField[],
  stopTypes: string[]
) => {
  const filteredObj: Record<string, any> = {}

  const fieldFilter = (field: Record<string, any>) => {
    if (field.localize === false) {
      return false
    } else if (field.type.name === 'string' || field.type.name === 'text') {
      return true
    } else if (Array.isArray(obj[field.name])) {
      return true
    } else if (!stopTypes.includes(field.type.name)) {
      return true
    }
    return false
  }

  const validFields = [
    '_key',
    '_type',
    '_id',
    ...objFields.filter(fieldFilter).map(field => field.name),
  ]
  validFields.forEach(field => {
    if (obj[field]) {
      filteredObj[field] = obj[field]
    }
  })
  return filteredObj
}

const serializeArray = (
  fieldContent: Record<string, any>[],
  fieldName: string,
  stopTypes: string[],
  serializers: Record<string, any>
) => {
  const validBlocks = fieldContent.filter(
    block => !stopTypes.includes(block._type)
  )

  const filteredBlocks = validBlocks.map(block => {
    const schema = getSchema(block._type)
    if (schema) {
      return fieldFilter(block, schema.fields, stopTypes)
    } else {
      return block
    }
  })

  const output = filteredBlocks.map(obj =>
    serializeObject(obj, null, stopTypes, serializers)
  )
  return `<div class="${fieldName}">${output.join()}</div>`
}

const serializeObject = (
  obj: Record<string, any>,
  topFieldName: string | null = null,
  stopTypes: string[],
  serializers: Record<string, any>
) => {
  if (stopTypes.includes(obj._type)) {
    return ''
  }

  const hasSerializer =
    serializers.types && Object.keys(serializers.types).includes(obj._type)

  if (obj._type !== 'span' && obj._type !== 'block' && !hasSerializer) {
    let innerHTML = ''
    Object.entries(obj).forEach(([fieldName, value]) => {
      let htmlField = ''

      if (!['_key', '_type', '_id'].includes(fieldName)) {
        if (typeof value === 'string') {
          const htmlRegex = /^</
          //this field may have been recursively turned into html already.
          htmlField = value.match(htmlRegex)
            ? value
            : `<span class="${fieldName}">${value}</span>`
        } else if (Array.isArray(value)) {
          htmlField = serializeArray(value, fieldName, stopTypes, serializers)
        } else {
          htmlField = serializeObject(value, fieldName, stopTypes, serializers)
        }
      }
      innerHTML += htmlField
    })

    serializers.types[obj._type] = (props: Record<string, any>) => {
      return h('div', {
        className: topFieldName ?? props.node._type,
        id: props.node._key ?? props.node._id,
        innerHTML: innerHTML,
      })
    }
  }

  let serializedBlock = ''
  try {
    serializedBlock = blocksToHtml({ blocks: [obj], serializers: serializers })
  } catch (err) {
    console.debug(
      `Had issues serializing block of type "${obj._type}". Please specify a serialization method for this block in your serialization config. Received error: ${err}`
    )
  }

  return serializedBlock
}

export const BaseDocumentSerializer: Serializer = {
  serializeDocument,
  fieldFilter,
  languageObjectFieldFilter,
  serializeArray,
  serializeObject,
}
