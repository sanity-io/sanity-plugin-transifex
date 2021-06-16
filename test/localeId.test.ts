import { localeIdToSmartling, localeIdFromSmartling } from '../src/localeId'

describe('localeIdToSmartling', () => {
  it('translates between Sanity locale ID and Smartling', () => {
    expect(localeIdToSmartling('en_UK')).toEqual('en-UK')
    expect(localeIdToSmartling('en')).toEqual('en')
    expect(localeIdToSmartling('no_NB')).toEqual('no-NB')
  })
})

describe('localeIdFromSmartling', () => {
  it('translates between Smartling locale ID and Sanity', () => {
    expect(localeIdFromSmartling('en-UK')).toEqual('en_UK')
    expect(localeIdFromSmartling('en')).toEqual('en')
    expect(localeIdFromSmartling('no-NB')).toEqual('no_NB')
  })
})
