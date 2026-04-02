import { describe, it, expect } from 'vitest'
import { commonPrefix } from './strings'

describe('commonPrefix', () => {
  it('finds common prefix', () => {
    expect(commonPrefix(['abc', 'ab', 'a'])).toBe('a')
    expect(commonPrefix(['abcd', 'abce'])).toBe('abc')
  })

  it('returns empty string when there is no common prefix', () => {
    expect(commonPrefix(['abc', 'xyz'])).toBe('')
  })

  it('returns empty string when one word is empty', () => {
    expect(commonPrefix(['abc', 'ab', ''])).toBe('')
  })

  it('returns the word itself for a single-element array', () => {
    expect(commonPrefix(['hello'])).toBe('hello')
  })

  it('returns empty string for an empty array', () => {
    expect(commonPrefix([])).toBe('')
  })

  it('returns the full string when all words are identical', () => {
    expect(commonPrefix(['abc', 'abc', 'abc'])).toBe('abc')
  })
})
