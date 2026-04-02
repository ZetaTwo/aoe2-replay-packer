import { describe, it, expect } from 'vitest'
import { MatchSetDefinition, MatchSetType } from './matchset'

describe('MatchSetDefinition', () => {
  it('correctly parses BestOf definition', () => {
    const setDefinition = MatchSetDefinition.parse('bo3')
    expect(setDefinition.length).toBe(3)
    expect(setDefinition.type).toBe(MatchSetType.BestOf)
  })

  it('correctly parses PlayAll definition', () => {
    const setDefinition = MatchSetDefinition.parse('pa5')
    expect(setDefinition.length).toBe(5)
    expect(setDefinition.type).toBe(MatchSetType.PlayAll)
  })

  it('throws error on invalid set type', () => {
    expect(() => MatchSetDefinition.parse('xx3')).toThrow(/^Invalid set/)
  })

  it('throws error on invalid set length', () => {
    expect(() => MatchSetDefinition.parse('boXX')).toThrow(/^Invalid set/)
  })
})

describe('MatchSetDefinition.label', () => {
  it('formats BestOf label', () => {
    expect(new MatchSetDefinition(MatchSetType.BestOf, 3).label()).toBe('Best of 3')
  })

  it('formats PlayAll label', () => {
    expect(new MatchSetDefinition(MatchSetType.PlayAll, 5).label()).toBe('Play all 5')
  })
})
