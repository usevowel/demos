import { describe, expect, test } from 'bun:test'
import { searchProducts } from './productsStore'

describe('searchProducts', () => {
  test('matches canonical categories', () => {
    const results = searchProducts({ query: 'electronics' })

    expect(results.length).toBeGreaterThan(0)
    expect(results.every(product => product.category === 'Electronics')).toBe(true)
  })

  test('matches category synonym queries', () => {
    const results = searchProducts({ query: 'tech' })

    expect(results.length).toBeGreaterThan(0)
    expect(results.every(product => product.category === 'Electronics')).toBe(true)
  })

  test('matches punctuation-normalized tag queries', () => {
    const results = searchProducts({ query: 'usb-c' })

    expect(results.length).toBeGreaterThan(0)
    expect(results.some(product => product.tags?.includes('usb-c'))).toBe(true)
  })

  test('ignores filler words in natural-language queries', () => {
    const plainResults = searchProducts({ query: 'electronics' })
    const conversationalResults = searchProducts({ query: 'show me electronics please' })

    expect(conversationalResults.map(product => product.id)).toEqual(plainResults.map(product => product.id))
  })

  test('matches simple plural queries', () => {
    const singularResults = searchProducts({ query: 'backpack' })
    const pluralResults = searchProducts({ query: 'backpacks' })

    expect(pluralResults.map(product => product.id)).toEqual(singularResults.map(product => product.id))
  })

  test('matches related charging terms without broad category expansion', () => {
    const results = searchProducts({ query: 'chargers' })

    expect(results.length).toBeGreaterThan(0)
    expect(results.some(product => /charging/i.test(product.description))).toBe(true)
  })
})
