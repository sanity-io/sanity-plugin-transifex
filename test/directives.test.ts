import { formatProperty, collectFormats } from '../src/formatPath'
import {
  directives,
  formatDirectives,
  SmartlingDirectives,
} from '../src/directives'

describe('formatProperty', () => {
  it('figures out what kind of content it is', () => {
    expect(
      formatProperty({
        _type: 'localeString',
        en: 'This is a string',
      })
    ).toEqual('txt')

    expect(
      formatProperty({
        _type: 'localeMarkdown',
        en: '# Hi there',
      })
    ).toEqual('markdown')

    expect(
      formatProperty({
        _type: 'localeHtml',
        en: '<b>Hello</b>',
      })
    ).toEqual('html')

    expect(
      formatProperty({
        _type: 'html',
        en: '<b>Hello</b>',
      })
    ).toEqual('html')

    expect(formatProperty('hello')).toEqual('txt')
    expect(formatProperty(12)).toEqual('txt')
  })
})

describe('collect format paths', () => {
  it('collects all the different supported formats', () => {
    const doc = {
      title: {
        en: 'English',
      },
      seo: {
        heading: {
          en: 'English SEO title',
          fr: 'French SEO title',
        },
      },
      number: 12,
      heading: 'Dont mind me',
      body: {
        _type: 'localeMarkdown',
        en: '#Heading\nLine',
        no: '#Overskrift\nLinje',
      },
      nested: {
        body: {
          _type: 'markdown',
          en: '# HOho',
        },
      },
      web: {
        content: {
          _type: 'html',
          html: '<b>Hello</b>',
        },
      },
    }

    const result = collectFormats(doc, 'en')
    expect(result.txt).toEqual(['title/en', 'seo/heading/en'])
    expect(result.markdown).toEqual(['body/en', 'nested/body/en'])
    expect(result.html).toBeUndefined()
  })
})

describe('directives', () => {
  const result = directives(
    {
      _id: 'abcdef',
      _rev: '12',
      title: {
        en: 'English title',
      },
      deep: {
        object: {
          en: 'Deep english value',
        },
      },
      body: {
        _type: 'localeMarkdown',
        en: '# Title goes here\n- List or something here',
      },
      ignoreMe: {
        es: 'Esta',
      },
    },
    'en'
  )

  it('always sets vairants enabled', () => {
    expect(result.variants_enabled).toBe(true)
  })

  it('translate_paths for all base language properties', () => {
    expect(result.translate_paths).toEqual([
      {
        path: '*/en',
        key: '{*}/{en}',
      },
    ])
  })

  it('collects the different formats in the file', () => {
    expect(result.string_format_paths).toEqual({
      txt: ['title/en', 'deep/object/en'],
      markdown: ['body/en'],
    })
  })
})

describe('formatDirectives', () => {
  it('formats directives for query param use', () => {
    const directives: SmartlingDirectives = {
      variants_enabled: true,
      translate_paths: [
        {
          path: 'fields/*/en-US',
          character_limit: 'fields/*/character_limit',
          key: '{*}/{en-US}',
        },
      ],
      string_format_paths: {
        txt: ['all/txt/en'],
        markdown: ['other/markdown/en'],
        html: ['seo/content/en'],
      },
    }

    const result = formatDirectives(directives)
    expect(result).toEqual({
      'smartling.string_format_paths':
        'txt: [all/txt/en], markdown: [other/markdown/en], html: [seo/content/en]',
      'smartling.translate_paths':
        '[{"path":"fields/*/en-US","character_limit":"fields/*/character_limit","key":"{*}/{en-US}"}]',
      'smartling.variants_enabled': 'true',
    })
  })
})
