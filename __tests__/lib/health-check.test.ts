import { ListingHealthCheck } from '@/lib/health-check'

describe('ListingHealthCheck', () => {
  let healthCheck: ListingHealthCheck

  beforeEach(() => {
    healthCheck = new ListingHealthCheck()
  })

  describe('checkListing', () => {
    const mockListingData = {
      title: 'Handmade Ceramic Coffee Mug - Blue Glaze',
      description: 'Beautiful handmade ceramic coffee mug with stunning blue glaze. Perfect for your morning coffee or tea. Each mug is unique and crafted with love. Features: • Handmade by skilled artisans • Food-safe glaze • Dishwasher and microwave safe • Unique design • Perfect gift idea',
      tags: ['handmade', 'ceramic', 'coffee mug', 'blue glaze', 'unique', 'artisan', 'kitchen', 'morning coffee', 'tea cup', 'gift idea', 'handcrafted', 'pottery'],
      images: [
        { width: 2000, height: 2000, alt_text: 'Handmade ceramic coffee mug with beautiful blue glaze' },
        { width: 2000, height: 2000, alt_text: 'Ceramic mug showing blue glaze detail' },
        { width: 2000, height: 2000, alt_text: 'Mug in use with coffee' }
      ],
      price: { amount: 2499, divisor: 100 },
      views: 342,
      sales: 23
    }

    it('should perform comprehensive health check', async () => {
      const result = await healthCheck.checkListing(12345, mockListingData)

      expect(result).toHaveProperty('listingId', 12345)
      expect(result).toHaveProperty('title', mockListingData.title)
      expect(result).toHaveProperty('overallScore')
      expect(result).toHaveProperty('issues')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('metrics')
      expect(result).toHaveProperty('lastChecked')

      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
      expect(Array.isArray(result.issues)).toBe(true)
      expect(Array.isArray(result.recommendations)).toBe(true)
    })

    it('should identify title issues', async () => {
      const badListingData = {
        ...mockListingData,
        title: 'Mug' // Too short
      }

      const result = await healthCheck.checkListing(12346, badListingData)
      const titleIssues = result.issues.filter(issue => issue.category === 'title')

      expect(titleIssues.length).toBeGreaterThan(0)
      expect(titleIssues[0].issue).toContain('too short')
    })

    it('should identify description issues', async () => {
      const badListingData = {
        ...mockListingData,
        description: 'Short description' // Too short
      }

      const result = await healthCheck.checkListing(12347, badListingData)
      const descriptionIssues = result.issues.filter(issue => issue.category === 'description')

      expect(descriptionIssues.length).toBeGreaterThan(0)
      expect(descriptionIssues[0].issue).toContain('too short')
    })

    it('should identify tag issues', async () => {
      const badListingData = {
        ...mockListingData,
        tags: ['tag1', 'tag2'] // Too few tags
      }

      const result = await healthCheck.checkListing(12348, badListingData)
      const tagIssues = result.issues.filter(issue => issue.category === 'tags')

      expect(tagIssues.length).toBeGreaterThan(0)
      expect(tagIssues[0].issue).toContain('too few tags')
    })

    it('should identify image issues', async () => {
      const badListingData = {
        ...mockListingData,
        images: [
          { width: 500, height: 500, alt_text: '' } // Low resolution, no alt text
        ]
      }

      const result = await healthCheck.checkListing(12349, badListingData)
      const imageIssues = result.issues.filter(issue => issue.category === 'images')

      expect(imageIssues.length).toBeGreaterThan(0)
      expect(imageIssues.some(issue => issue.issue.includes('resolution'))).toBe(true)
      expect(imageIssues.some(issue => issue.issue.includes('alt text'))).toBe(true)
    })

    it('should identify pricing issues', async () => {
      const badListingData = {
        ...mockListingData,
        price: { amount: 100, divisor: 100 } // Too low price
      }

      const result = await healthCheck.checkListing(12350, badListingData)
      const pricingIssues = result.issues.filter(issue => issue.category === 'pricing')

      expect(pricingIssues.length).toBeGreaterThan(0)
      expect(pricingIssues[0].issue).toContain('too low')
    })
  })

  describe('bulkHealthCheck', () => {
    it('should perform bulk health check on multiple listings', async () => {
      const mockListings = [
        { listingId: 1, title: 'Listing 1', description: 'Description 1', tags: ['tag1'], images: [], price: { amount: 1000, divisor: 100 } },
        { listingId: 2, title: 'Listing 2', description: 'Description 2', tags: ['tag1'], images: [], price: { amount: 2000, divisor: 100 } }
      ]

      const result = await healthCheck.bulkHealthCheck([1, 2], mockListings)

      expect(result).toHaveProperty('totalListings', 2)
      expect(result).toHaveProperty('checkedListings')
      expect(result).toHaveProperty('averageScore')
      expect(result).toHaveProperty('criticalIssues')
      expect(result).toHaveProperty('warnings')
      expect(result).toHaveProperty('topIssues')
      expect(result).toHaveProperty('categoryScores')
      expect(result).toHaveProperty('recommendations')

      expect(result.checkedListings).toBeGreaterThanOrEqual(0)
      expect(result.averageScore).toBeGreaterThanOrEqual(0)
      expect(result.averageScore).toBeLessThanOrEqual(100)
    })
  })
})
