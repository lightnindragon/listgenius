import { NicheFinder } from '@/lib/niche-finder'

describe('NicheFinder', () => {
  let nicheFinder: NicheFinder

  beforeEach(() => {
    nicheFinder = new NicheFinder()
  })

  describe('findProfitableNiches', () => {
    it('should find profitable niches with default filters', async () => {
      const niches = await nicheFinder.findProfitableNiches()

      expect(Array.isArray(niches)).toBe(true)
      expect(niches.length).toBeGreaterThan(0)

      if (niches.length > 0) {
        const niche = niches[0]
        expect(niche).toHaveProperty('niche')
        expect(niche).toHaveProperty('category')
        expect(niche).toHaveProperty('demand')
        expect(niche).toHaveProperty('competition')
        expect(niche).toHaveProperty('opportunity')
        expect(niche).toHaveProperty('difficulty')
        expect(niche).toHaveProperty('avgPrice')
        expect(niche).toHaveProperty('totalListings')
        expect(niche).toHaveProperty('topKeywords')
        expect(niche).toHaveProperty('marketSize')
        expect(niche).toHaveProperty('trendDirection')
        expect(niche).toHaveProperty('seasonality')
        expect(niche).toHaveProperty('profitPotential')
        expect(niche).toHaveProperty('entryBarriers')
        expect(niche).toHaveProperty('recommendations')

        expect(niche.demand).toBeGreaterThanOrEqual(0)
        expect(niche.demand).toBeLessThanOrEqual(100)
        expect(niche.competition).toBeGreaterThanOrEqual(0)
        expect(niche.competition).toBeLessThanOrEqual(100)
        expect(niche.opportunity).toBeGreaterThanOrEqual(0)
        expect(niche.opportunity).toBeLessThanOrEqual(100)
        expect(Array.isArray(niche.topKeywords)).toBe(true)
        expect(Array.isArray(niche.recommendations)).toBe(true)
      }
    })

    it('should filter niches by category', async () => {
      const niches = await nicheFinder.findProfitableNiches({
        categories: ['Home & Living']
      })

      expect(Array.isArray(niches)).toBe(true)
      if (niches.length > 0) {
        expect(niches.every(niche => niche.category === 'Home & Living')).toBe(true)
      }
    })

    it('should filter niches by demand range', async () => {
      const niches = await nicheFinder.findProfitableNiches({
        minDemand: 70,
        maxCompetition: 50
      })

      expect(Array.isArray(niches)).toBe(true)
      if (niches.length > 0) {
        expect(niches.every(niche => niche.demand >= 70)).toBe(true)
        expect(niches.every(niche => niche.competition <= 50)).toBe(true)
      }
    })

    it('should respect limit parameter', async () => {
      const niches = await nicheFinder.findProfitableNiches({}, 5)

      expect(niches.length).toBeLessThanOrEqual(5)
    })
  })

  describe('analyzeNiche', () => {
    it('should analyze a specific niche', async () => {
      const analysis = await nicheFinder.analyzeNiche('handmade jewelry')

      expect(analysis).toHaveProperty('niche', 'handmade jewelry')
      expect(analysis).toHaveProperty('category')
      expect(analysis).toHaveProperty('demand')
      expect(analysis).toHaveProperty('competition')
      expect(analysis).toHaveProperty('opportunity')
      expect(analysis).toHaveProperty('difficulty')
      expect(analysis).toHaveProperty('avgPrice')
      expect(analysis).toHaveProperty('totalListings')
      expect(analysis).toHaveProperty('topKeywords')
      expect(analysis).toHaveProperty('marketSize')
      expect(analysis).toHaveProperty('trendDirection')
      expect(analysis).toHaveProperty('seasonality')
      expect(analysis).toHaveProperty('profitPotential')
      expect(analysis).toHaveProperty('entryBarriers')
      expect(analysis).toHaveProperty('recommendations')

      expect(Array.isArray(analysis.topKeywords)).toBe(true)
      expect(Array.isArray(analysis.recommendations)).toBe(true)
    })
  })

  describe('getTrendingNiches', () => {
    it('should get trending niches', async () => {
      const trendingNiches = await nicheFinder.getTrendingNiches(10)

      expect(Array.isArray(trendingNiches)).toBe(true)
      expect(trendingNiches.length).toBeLessThanOrEqual(10)

      if (trendingNiches.length > 0) {
        const niche = trendingNiches[0]
        expect(niche).toHaveProperty('opportunity')
        expect(niche.opportunity).toBeGreaterThan(60) // Trending niches should have good opportunity
      }
    })
  })

  describe('getPersonalizedNiches', () => {
    it('should get personalized niches for a user', async () => {
      const personalizedNiches = await nicheFinder.getPersonalizedNiches('test-user-id', 10)

      expect(Array.isArray(personalizedNiches)).toBe(true)
      expect(personalizedNiches.length).toBeLessThanOrEqual(10)

      if (personalizedNiches.length > 0) {
        const niche = personalizedNiches[0]
        expect(niche).toHaveProperty('niche')
        expect(niche).toHaveProperty('opportunity')
        expect(niche.opportunity).toBeGreaterThanOrEqual(50) // Personalized niches should have decent opportunity
      }
    })
  })
})
