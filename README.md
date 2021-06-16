# Sanity + Transifex = 🌐


This plugin provides an in-studio integration with [Transifex](https://transifex.com), allowing your editors to send any document to Transifex with the click of a button, monitor the progress of ongoing translations, and import partial or complete translations back into the studio. 

It's easiest to send your documents over to Transifex as naive HTML fragments that reflect the structure of your documents and then deserialize them upon import. This plugin provides the following:
 
* A new tab in your studio for the documents you want to translate
* An adapter that communicates with the Transifex file API
* Customizable HTML serialization and deserialization tooling
* Customizable document patching tooling

So let's get started!

## Quickstart

1. In your studio folder, run `sanity install transifex`.
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
   Because the document's `_id` is on a path (`transifex`), it won't be exposed to the outside world, even in a public dataset. If you have concerns about this being exposed to authenticated users of your studio, you can control access to this path with [role-based access control](https://www.sanity.io/docs/access-control)
.
4. Get the Transifex tab on your desired document type, using whatever pattern you like. You'll use the [desk structure](https://www.sanity.io/docs/structure-builder-introduction) for this. The options for translation will be nested under this desired document type's views. Here's an example:

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

If you have a more nested/complex document structure already, just add `TranslationTab` and the config to the views of that particular document type, as you would a live preview or any other tab.

And that should do it! Go into your studio, click around, and check the document in Transifex (it should be under its Sanity `_id`). Once it's translated, check the import by clicking the `Import` button on your Transifex tab!

### Important note on defaults

`defaultDocumentLevelConfig` and `defaultFieldLevelConfig` make a few assumptions that can be overridden (see the below section). Thes assumptions are based on [Sanity's existing recommendations on localization](https://www.sanity.io/docs/localization):
  * `defaultDocumentLevelConfig`:
      * You want any fields containing text or text arrays to be translated.
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
        
## Overriding defaults, customizing serialization, and more!

TBD
  
