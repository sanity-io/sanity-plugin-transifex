import schema from 'part:@sanity/base/schema'
import Schema from '@sanity/schema'
import blockTools from '@sanity/block-tools'
import {
  customDeserializers,
  customBlockDeserializers,
} from './BaseSerializationConfig'
import { findLatestDraft } from './helpers'
import {
  ObjectField,
  SanityDocument,
  ObjectSchemaType,
  BlockSchemaType,
} from '@sanity/types'
import { Deserializer } from '../types'

const noSchemaWarning = (obj: Element) =>
  `WARNING: Unfortunately the deserializer may have issues with this field or object: ${obj.className}.
  If it's a specific type, you may need to declare  at the top level, or write a custom deserializer.`

const defaultSchema = Schema.compile({
  name: 'default',
  types: [
    {
      type: 'object',
      name: 'default',
      fields: [
        {
          name: 'block',
          type: 'array',
          of: [{ type: 'block' }],
        },
      ],
    },
  ],
})

const blockContentType = defaultSchema
  .get('default')
  .fields.find((field: ObjectField) => field.name === 'block').type

export const deserializeDocument = async (
  documentId: string,
  serializedDoc: string,
  deserializers: Record<string, any> = customDeserializers,
  blockDeserializers: Array<any> = customBlockDeserializers
) => {
  return findLatestDraft(documentId).then((doc: SanityDocument) =>
    deserializeHTML(
      serializedDoc,
      schema.get(doc._type),
      deserializers,
      blockDeserializers
    )
  )
}

const deserializeHTML = (
  html: string,
  target: ObjectSchemaType | BlockSchemaType,
  deserializers: Record<string, any>,
  blockDeserializers: Array<any>
): Record<string, any> | any[] => {
  //parent node is always div with classname of field -- get its children
  let HTMLnode = new DOMParser().parseFromString(html, 'text/html').body
    .children[0]
  if (!HTMLnode) {
    return {}
  }
  //@ts-ignore
  let output

  //catch embedded object as a field -- not necessarily foolproof
  if (
    HTMLnode.children.length === 1 &&
    target &&
    target.type &&
    HTMLnode.children[0].className === target.type.name
  ) {
    HTMLnode = HTMLnode.children[0]
  }

  if (
    target &&
    target.type &&
    target.type.name &&
    Object.keys(deserializers.types).includes(target.type.name)
  ) {
    const deserialize = deserializers.types[target.type.name]
    output = deserialize(HTMLnode)
  } else {
    const children = Array.from(HTMLnode.children)
    output = target && target.type && target.type.hasOwnProperty('of') ? [] : {}

    children.forEach(child => {
      let deserializedObj
      //allow for custom deserialization
      if (Object.keys(deserializers.types).includes(child.className)) {
        const deserialize = deserializers.types[child.className]
        deserializedObj = deserialize(child)
      }
      //flat string, it's an unrich field
      else if (child.tagName.toLowerCase() === 'span') {
        deserializedObj = child.innerHTML
      }

      //has specific class name, so it's either a field or obj
      else if (child.className) {
        let objType
        if (target.fields) {
          objType = target.fields.find(field => field.name === child.className)
        }

        if (!objType && schema.get(child.className)) {
          objType = schema.get(child.className)
        }

        if (!objType) {
          console.debug(noSchemaWarning(child))
          objType = blockContentType
        }

        try {
          deserializedObj = deserializeHTML(
            child.outerHTML,
            objType,
            deserializers,
            blockDeserializers
          )
        } catch (err) {
          console.debug(err)
          try {
            deserializedObj = deserializeHTML(
              child.outerHTML,
              schema.get('object'),
              deserializers,
              blockDeserializers
            )
          } catch (err) {
            console.debug(
              `Tried to deserialize block of type ${child.className} but failed! Received error ${err}`
            )
          }
        }

        // @ts-ignore
        if (Array.isArray(output) && deserializedObj) {
          deserializedObj._type = child.className
          deserializedObj._key = child.id
        }
      } else {
        deserializedObj = blockTools.htmlToBlocks(
          child.outerHTML,
          blockContentType,
          { rules: blockDeserializers }
        )[0]
        deserializedObj._key = child.id
      }

      // @ts-ignore
      if (Array.isArray(output)) {
        output.push(deserializedObj)
      } else {
        // @ts-ignore
        output[child.className] = deserializedObj
      }
    })
  }

  return output
}

export const BaseDocumentDeserializer: Deserializer = {
  deserializeDocument,
  deserializeHTML,
}
