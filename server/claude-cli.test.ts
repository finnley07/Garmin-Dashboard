import { describe, expect, it } from 'vitest'
import { extractUsage, MAX_RECOMMENDATIONS, sanitizeRecommendations } from './claude-cli.js'

describe('sanitizeRecommendations', () => {
  it('keeps valid recommendations unchanged', () => {
    const result = sanitizeRecommendations({
      recommendations: [
        {
          category: 'recovery',
          priority: 'high',
          title: 'Schlaf verbessern',
          description: 'Schlaf-Score 54/100. Priorisiere längere Schlafzeit.',
        },
      ],
    })

    expect(result).toEqual([
      {
        category: 'recovery',
        priority: 'high',
        title: 'Schlaf verbessern',
        description: 'Schlaf-Score 54/100. Priorisiere längere Schlafzeit.',
      },
    ])
  })

  it('maps unknown category and priority onto safe defaults', () => {
    const [rec] = sanitizeRecommendations({
      recommendations: [
        { category: 'sleep', priority: 'urgent', title: 'T', description: 'D' },
      ],
    })

    expect(rec?.category).toBe('general')
    expect(rec?.priority).toBe('medium')
  })

  it('accepts casing and padding from the model', () => {
    const [rec] = sanitizeRecommendations({
      recommendations: [
        { category: ' Training ', priority: 'HIGH', title: ' T ', description: ' D ' },
      ],
    })

    expect(rec?.category).toBe('training')
    expect(rec?.priority).toBe('high')
    expect(rec?.title).toBe('T')
  })

  it('drops entries without title or description', () => {
    const result = sanitizeRecommendations({
      recommendations: [
        { category: 'training', priority: 'low', title: '', description: 'D' },
        { category: 'training', priority: 'low', title: 'T', description: '   ' },
        { category: 'training', priority: 'low', title: 'T', description: 'D' },
        null,
        'nonsense',
      ],
    })

    expect(result).toHaveLength(1)
  })

  it('caps the number of recommendations', () => {
    const result = sanitizeRecommendations({
      recommendations: Array.from({ length: 9 }, (_, index) => ({
        category: 'training',
        priority: 'low',
        title: `T${index}`,
        description: 'D',
      })),
    })

    expect(result).toHaveLength(MAX_RECOMMENDATIONS)
  })

  it('clamps overly long text', () => {
    const [rec] = sanitizeRecommendations({
      recommendations: [
        { category: 'training', priority: 'low', title: 'T'.repeat(400), description: 'D'.repeat(900) },
      ],
    })

    expect(rec?.title).toHaveLength(120)
    expect(rec?.description).toHaveLength(600)
  })

  it('returns nothing for malformed payloads', () => {
    expect(sanitizeRecommendations(null)).toEqual([])
    expect(sanitizeRecommendations({})).toEqual([])
    expect(sanitizeRecommendations({ recommendations: 'nope' })).toEqual([])
  })
})

describe('extractUsage', () => {
  it('reads tokens, cost, duration and model from the CLI envelope', () => {
    const usage = extractUsage({
      type: 'result',
      is_error: false,
      duration_ms: 6234,
      total_cost_usd: 0.0031,
      usage: { input_tokens: 812, output_tokens: 486, cache_read_input_tokens: 128 },
      modelUsage: { 'claude-haiku-4-5-20251001': { inputTokens: 812 } },
    })

    expect(usage.model).toBe('claude-haiku-4-5-20251001')
    expect(usage.inputTokens).toBe(812)
    expect(usage.outputTokens).toBe(486)
    expect(usage.cacheReadTokens).toBe(128)
    expect(usage.costUsd).toBe(0.0031)
    expect(usage.durationMs).toBe(6234)
    expect(usage.ranAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('picks the primary model by matching token counts, not object key order', () => {
    // The CLI can run a cheap auxiliary call (e.g. Haiku) alongside the real
    // one and list it first in modelUsage - the top-level usage block always
    // belongs to the primary call, so that's what has to decide the match.
    const usage = extractUsage({
      type: 'result',
      is_error: false,
      duration_ms: 3178,
      total_cost_usd: 0.395,
      usage: { input_tokens: 2, output_tokens: 4, cache_read_input_tokens: 0 },
      modelUsage: {
        'claude-haiku-4-5-20251001': { inputTokens: 899, outputTokens: 13 },
        'claude-opus-5': { inputTokens: 2, outputTokens: 4 },
      },
    })

    expect(usage.model).toBe('claude-opus-5')
  })

  it('degrades to nulls instead of throwing on an unexpected envelope', () => {
    const usage = extractUsage({ type: 'result' })

    expect(usage.inputTokens).toBeNull()
    expect(usage.outputTokens).toBeNull()
    expect(usage.costUsd).toBeNull()
    expect(usage.durationMs).toBeNull()
  })

  it('handles a missing envelope', () => {
    const usage = extractUsage(null)

    expect(usage.inputTokens).toBeNull()
    expect(usage.cacheReadTokens).toBeNull()
  })
})
