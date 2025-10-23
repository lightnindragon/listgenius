import { KeywordDifficultyCalculator } from '@/lib/keyword-difficulty-calculator'

describe('KeywordDifficultyCalculator', () => {
  let calculator: KeywordDifficultyCalculator

  beforeEach(() => {
    calculator = new KeywordDifficultyCalculator({
      mockMode: true,
      userId: 'test-user',
    })
  })

  describe('calculateDifficulty', () => {
    it('should calculate difficulty for a keyword', async () => {
      const result = await calculator.calculateDifficulty('handmade jewelry')

      expect(result).toHaveProperty('overallScore')
      expect(result).toHaveProperty('competitionScore')
      expect(result).toHaveProperty('marketSaturationScore')
      expect(result).toHaveProperty('shopDominanceScore')
      expect(result).toHaveProperty('listingQualityScore')
      expect(result).toHaveProperty('seasonalityScore')
      expect(result).toHaveProperty('successProbability')
      expect(result).toHaveProperty('timeToRankEstimate')
      expect(result).toHaveProperty('recommendations')

      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
      expect(result.successProbability).toBeGreaterThanOrEqual(0)
      expect(result.successProbability).toBeLessThanOrEqual(100)
      expect(Array.isArray(result.recommendations)).toBe(true)
    })

    it('should return higher difficulty for competitive keywords', async () => {
      const competitiveResult = await calculator.calculateDifficulty('vintage jewelry')
      const nicheResult = await calculator.calculateDifficulty('handmade ceramic mugs')

      expect(competitiveResult.overallScore).toBeGreaterThan(nicheResult.overallScore)
    })

    it('should provide actionable recommendations', async () => {
      const result = await calculator.calculateDifficulty('test keyword')

      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(result.recommendations[0]).toMatch(/focus|improve|consider|optimize/i)
    })
  })

  describe('batchAnalysis', () => {
    it('should analyze multiple keywords', async () => {
      const keywords = ['handmade jewelry', 'vintage decor', 'custom gifts']
      const results = await calculator.batchAnalysis(keywords)

      expect(results).toHaveLength(keywords.length)
      expect(results[0]).toHaveProperty('keyword', 'handmade jewelry')
      expect(results[0]).toHaveProperty('overallScore')
    })

    it('should handle empty keyword array', async () => {
      const results = await calculator.batchAnalysis([])
      expect(results).toHaveLength(0)
    })
  })

  describe('getImprovementSuggestions', () => {
    it('should provide improvement suggestions based on scores', async () => {
      const difficulty = await calculator.calculateDifficulty('test keyword')
      const suggestions = calculator.getImprovementSuggestions(difficulty)

      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThan(0)
    })
  })
})
