# Sanity + Transifex = 🌍


This plugin provides an in-studio integration with [Transifex](https://transifex.com). It allows your editors to send any document to Transifex with the click of a button, monitor ongoing translations, and import partial or complete translations back into the studio. 

To maintain document structure, it's easiest to send your documents over to Transifex as HTML fragments, then deserialize them upon import. This plugin provides the following:
 
* A new tab in your studio for the documents you want to translate
* An adapter that communicates with the Transifex file API
* Customizable HTML serialization and deserialization tooling
* Customizable document patching tooling

So let's get started!

<br />

## Quickstart

1. In your studio folder, run `sanity install sanity-plugin-transifex`.
2. Ensure the plugin has access to your Transifex secrets. You'll want to create a document that includes your project name, organization name, and a token with appropriate access. [Please refer to the Transifex documentation on creating a token if you don't have one already.](https://docs.transifex.com/account/authentication)
    * In your studio, create a file called `populateTransifexSecrets.js`.
    * Place the following in the file and fill out the correct values (those in all-caps).
    
```javascript
import sanityClient from 'part:@sanity/base/client'

const client = sanityClient.withConfig({ apiVersion: '2021-03-25' })

client.createOrReplace({
_id: 'transifex.secrets',
_type: 'transifexSettings',
organization: 'YOUR_ORG_HERE',
project: 'YOUR_PROJECT_HERE',
token: 'YOUR_TOKEN_HERE',
})
```

   * On the command line, run the file with `sanity exec populateTransifexSecrets.js --with-user-token`. 
   Verify that everything went well by using Vision in the studio to query `*[_id == 'transifex.secrets']`. (NOTE: If you have multiple datasets, you'll have to do this across all of them, since it's a document!)
   * If everything looks good, go ahead and delete `populateTransifexSecrets.js` so you don't commit it. 
   Because the document's `_id` is on a path (`transifex`), it won't be exposed to the outside world, even in a public dataset. If you have concerns about this being exposed to authenticated users of your studio, you can control access to this path with [role-based access control](https://www.sanity.io/docs/access-control).
   
3. Get the Transifex tab on your desired document type, using whatever pattern you like. You'll use the [desk structure](https://www.sanity.io/docs/structure-builder-introduction) for this. The options for translation will be nested under this desired document type's views. Here's an example:

```javascript
import S from '@sanity/desk-tool/structure-builder'
//...your other desk structure imports...
import { TranslationTab, defaultDocumentLevelConfig, defaultFieldLevelConfig } from 'sanity-plugin-transifex'


export const getDefaultDocumentNode = (props) => {
  if (props.schemaType === 'myTranslatableDocumentType') {
    return S.document().views([
      S.view.form(),
      //...my other views -- for example, live preview, the i18n plugin, etc.,
      S.view.component(TranslationTab).title('Transifex').options(
        defaultDocumentLevelConfig  
      )
    ])
  }
  return S.document();
};
```

And that should do it! Go into your studio, click around, and check the document in Transifex (it should be under its Sanity `_id`). Once it's translated, check the import by clicking the `Import` button on your Transifex tab!

<br />
<br />

### Important note on defaults

`defaultDocumentLevelConfig` and `defaultFieldLevelConfig` make a few assumptions that can be overridden (see the below section). These assumptions are based on [Sanity's existing recommendations on localization](https://www.sanity.io/docs/localization):
  * `defaultDocumentLevelConfig`:
      * You want _any_ fields containing text or text arrays to be translated.
      * You're storing documents in different languages along a path pattern like `i18n.{id-of-base-language-document}.{locale}`.
  * `defaultFieldLevelConfig`:
      * Your base language is English.
      * Any fields you want translated exist in the multi-locale object form we recommend.
        For example, on a document you don't want to be translated, you may have a "title" field that's a flat string: `title: 'My title is here.'` For a field you want to include many languages for, your title may look like
        ```
        { title: {
            en: 'My title is here.',
            es: 'Mi título está aquí.',
            etc...
          }
        }
        ```
        This config will look for the English values on all fields that look like this, and place translated values into their appropriate fields.
        
If your content models don't look like this, you can still run the plugin as an experiment -- you'll just likely get some funky results on import!

<br />
<br />

## Overriding defaults, customizing serialization, and more!

To truly fit your documents and layout, you have a lot of power over how exporting, importing, serializing, and patching work. Below are some common use cases / situations and how you can resolve them.
<br />
<br />

### Scenario: Some fields or objects in my document are serializing /deserializing strangely.
First: this is often caused by not declaring types at the top level of your schema. Serialization introspects your schema files and can get a much better sense of what to do when objects are not "anonymous" (this is similar to how our GraphQL functions work -- more info on "strict" schemas [here](https://www.sanity.io/docs/graphql#33ec7103289a)) You can save yourself some development time by trying this first.

If that's still not doing the trick, you can add on to the serializer to ensure you have complete say over how an object gets serialized and deserialized. Under the hood, serialization is using Sanity's [blocks-to-html](https://github.com/sanity-io/block-content-to-html), and the same principles apply here. We strongly recommend you check that documentation to understand how to use these serialization rules. Here's how you might declare and use some custom serialization. 

First, write your serialization rules:

```javascript
import { h } from '@sanity/block-content-to-html'
import { customSerializers } from 'sanity-plugin-transifex'

const myCustomSerializerTypes = {
  ...customSerializers.types,
  myType: (props) => {
     const innerElements = //do things with the props
     //className and id is VERY important!! don't forget them!!
     return h('div', { className: props.node._type, id: props.node._key }, innerElements)
  }
}

const myCustomSerializers = customSerializers
myCustomSerializers.types = myCustomSerializerTypes

const myCustomDeserializer = {
  types: {
    myType: (htmlString) => {
      //parse it back out!
    }
  }
}
  
```

If your object is inline, then you may need to use the deserialization rules in Sanity's [block-tools](https://github.com/sanity-io/sanity/tree/next/packages/@sanity/block-tools) (also used in deserialzation. So you might declare something like this:

```javascript
const myBlockDeserializationRules = [
  {
    deserialize(el, next, block) {
      if (el.className.toLowerCase() != myType.toLowerCase()) {
        return undefined
      }
      
      //do stuff with the HTML string
      return {
        _type: 'myType',
        //all my other fields
      })
    }
]
```

Now, to bring it all together:

```javascript
import { TranslationTab, defaultDocumentLevelConfig, BaseDocumentSerializer, BaseDocumentDeserializer, BaseDocumentPatcher, defaultStopTypes } from "sanity-plugin-transifex"

const myCustomConfig = {
  ...defaultDocumentLevelConfig,
   exportForTranslation: (id) => 
    BaseDocumentSerializer.serializeDocument(
      id,
      'document',
      'en',
      defaultStopTypes,
      myCustomSerializers),
     importTranslation: (id, localeId, document) => {
        return BaseDocumentDeserializer.deserializeDocument(
          id,
          document,
          myCustomDeserializer,
          myBlockDeserializationRules).then(
            deserialized =>
              BaseDocumentPatcher.documentLevelPatch(deserialized, id, localeId)
          )
      }
}

```

Then, in your document structure, just feed the config into your `TranslationTab`.

```javascript
        S.view.component(TranslationTab).title('Transifex').options(
          myCustomConfig
        )
```

<br />
<br />

### Scenario: I want to have more granular control over how my documents get patched back to my dataset.

If all the serialization is working to your liking, but you have a different setup for how your document works, you can overwrite that patching logic.

```javascript
import { TranslationTab, defaultDocumentLevelConfig, BaseDocumentDeserializer } from "sanity-plugin-transifex"

const myCustomConfig = {
  ...defaultDocumentLevelConfig,
  importTranslation: (id, localeId, document) => {
    return BaseDocumentDeserializer.deserializeDocument(id,document).then(
        deserialized =>
        //you should have an object of translated values here. Do things with them!
      )
  }
}
```

<br />
<br />

### Scenario: I want to ensure certain fields never get sent to my translators.
The serializer actually introspects your schema files. You can set `localize: false` on a schema and that field should not be sent off. Example:
```javascript
   fields: [{
      name: 'categories',
      type: 'array',
      localize: false,
      ...
      }]
```

<br /> 
<br />

### Scenario: I want to ensure certain types of objects never get serialized or sent to my translators.

This plugin ships with a specification called `stopTypes`. By default it ignores fields that don't have useful linguistic information -- dates, numbers, etc. You can add to it easily.

```javascript
import { TranslationTab, defaultDocumentLevelConfig, defaultStopTypes, BaseDocumentSerializer } from "sanity-plugin-transifex"

const myCustomStopTypes = [
  ...defaultStopTypes,
  'listItem'
]

const myCustomConfig = {
  ...defaultDocumentLevelConfig,
  exportForTranslation: (id) => BaseDocumentSerializer.serializeDocument(
    id, 'document', 'en', myCustomStopTypes)
}
```

As above, feed the config into your `TranslationTab`.

```javascript

        S.view.component(TranslationTab).title('Transifex').options(
          myCustomConfig
        )

```

There's a number of further possibilities here. Pretty much every interface provided can be partially or fully overwritten. Do write an issue if something seems to never work how you expect, or if you'd like a more elegant way of doing things. 

This plugin is in early stages. We plan on improving some of the user-facing Chrome, sorting out some quiet bugs, figuring out where things don't fail elegantly, etc. Please be a part of our development process!

  
