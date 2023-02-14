# Sanity + Transifex = 🌍

This is the Studio V2 version of the Transifex plugin.

This plugin provides an in-studio integration with [Transifex](https://transifex.com). It allows your editors to send any document to Transifex with the click of a button, monitor ongoing translations, and import partial or complete translations back into the studio.

# Table of Contents
- [Plugin features](#plugin-features)
- [Assumptions](#assumptions)
- [Quickstart](#quickstart)
- [Studio experience](#studio-experience)
- [Overriding defaults](#overriding-defaults)
- [v1 to v2 changes](#v1-to-v2-changes)


## Plugin features

This plugin comes with (and exposes to the developer) the following items:
- An `Adapter` that connects to the Transifex API with methods to create a new translation job, upload and assign a file to that translation job, check the progress of an ongoing translation, and retrieve a translated file.
- A `Serializer` that transforms your content into HTML (we found this was the most efficient way to maintain your document structure, no matter how deeply nested, while remaining readable to translators in Transifex). The `Serializer` takes in optional arguments: `stopTypes`, which prevents certain types from being sent to your translatiors and `customSerializers`, which are rules you can use to have full control over how individual fields on your document get serialized.
- A `Deserializer` that deserializes translated text back to Sanity's format.
- A `Patcher` which determines how your content gets patched back into its destination document or field.
- A `TranslationsTab`, a React element that allows a non-technical user to import, export, and monitor Transifex progress.

To make life easier, we also include `defaultFieldLevelConfig` and `defaultDocumentLevelConfig`, which bundles all of the above up to get you up and running quickly. 

## Assumptions
To use the default config mentioned above, we assume that you are following the conventions we outline in [our documentation on localization](https://www.sanity.io/docs/localization). 


### Field-level translations
If you are using field-level translation, we assume any fields you want translated exist in the multi-locale object form we recommend.
For example, on a document you don't want to be translated, you may have a "title" field that's a flat string: `title: 'My title is here.'` For a field you want to include many languages for, your title may look like
        ```
        { title: {
            en: 'My title is here.',
            es: 'Mi título está aquí.',
            etc...
          }
        }
        ```

### Document level translations
Since we often find users want to use the [Document internationalization plugin](https://www.sanity.io/plugins/document-internationalization) if they're using document-level translations, we assume that any documents you want in different languages will follow the pattern `{id-of-base-language-document}__i18n_{locale}`

### Final note
It's okay if your data doesn't follow these patterns and you don't want to change them! You will simply have to override how the plugin gets and patches back information from your documents. Please see [Overriding defaults](#overriding-defaults).

## Quickstart

1. In your studio folder, run `npm install sanity-plugin-transifex`.
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

## Studio experience
By adding the `TranslationsTab` to your desk structure, your users should now have an additional view. The boxes at the top of the tab can be used to send translations off to Transifex, and once those jobs are started, they should see progress bars monitoring the progress of the jobs. They can import a partial or complete job back.

## Overriding defaults

To personalize this configuration it's useful to know what arguments go into `TranslationsTab` as options (the `defaultConfigs` are just wrappers for these):
  * `exportForTranslation`: a function that takes your document id and returns an object with `name`: the field you want to use identify your doc in Transifex (by default this is `_id` and `content`: a serialized HTML string of all the fields in your document to be translated.
  * `importTranslation`: a function that takes in `id` (your document id) `localeId` (the locale of the imported language) and `document` the translated HTML from Transifex. It will deserialize your document back into an object that can be patched into your Sanity data, and then executes that patch.
  * `Adapter`: An interface with methods to send things over to Transifex. You likely don't want to override this!

There are a number of reasons to override these functions. More general cases are often around ensuring documents serialize and deserialize correctly. Since the serialization fucntions are used across all our translation plugins currently, you can find some frequently encountered scenarios at [their repository here](https://github.com/sanity-io/sanity-naive-html-serializer), along with code examples for new config. 

## V1 to V2 changes

Most users will not encounter issues in upgrading to v2. The breaking changes are as follows:

1. **Change to document-level localization id structure.** Since the [Internationalization input plugin](https://www.sanity.io/plugins/sanity-plugin-intl-input) was deprecated, the default pattern `i18n.{id-of-base-language-document}.{locale}` was deprecated in favor of `{id-of-base-language-document}__i18n_{locale}`. If you would like to maintain that pattern, please add the `idStructure` param to your tab config, like:
```javascript
S.view.component(TranslationsTab).title('Transifex').options(
  {...defaultDocumentLevelConfig, idStructure: 'subpath'}
)
```
2. **Underlying changes in serializers.** Serializers were updated to a) take advantage of the newer [Portable Text to HTML package](https://github.com/portabletext/to-html) and allow for explicit schema closures. If you were overriding serialization methods, that means invocation of `BaseDocumentSerializer` will change from:
```javascript
BaseDocumentSerializer.serializeDocument(id, 'serialization-level')
```

to:
```javascript
import schemas from 'part:@sanity/base/schema'

BaseDocumentSerializer(schemas).serializeDocument(id, 'serialization-level')
```


This plugin is in early stages. We plan on improving some of the user-facing chrome, sorting out some quiet bugs, figuring out where things don't fail elegantly, etc. Please be a part of our development process!

