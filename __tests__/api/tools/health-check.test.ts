import { NextRequest } from 'next/server'
import { POST } from '@/app/api/tools/health-check/route'

// Mock the auth function
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => Promise.resolve({ userId: 'test-user-id' }))
}))

describe('/api/tools/health-check', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should check single listing health', async () => {
      const requestBody = {
        action: 'single',
        listingId: 12345,
        listingData: {
          title: 'Handmade Ceramic Coffee Mug - Blue Glaze',
          description: 'Beautiful handmade ceramic coffee mug with stunning blue glaze. Perfect for your morning coffee or tea. Each mug is unique and crafted with love.',
          tags: ['handmade', 'ceramic', 'coffee mug', 'blue glaze', 'unique', 'artisan', 'kitchen', 'morning coffee', 'tea cup', 'gift idea'],
          images: [
            { width: 2000, height: 2000, alt_text: 'Handmade ceramic coffee mug with beautiful blue glaze' }
          ],
          price: { amount: 2499, divisor: 100 }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/tools/health-check', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('result')
      expect(data.data).toHaveProperty('checkedAt')
      expect(data.data.result).toHaveProperty('listingId', 12345)
      expect(data.data.result).toHaveProperty('overallScore')
      expect(data.data.result).toHaveProperty('issues')
      expect(data.data.result).toHaveProperty('recommendations')
      expect(data.data.result).toHaveProperty('metrics')
    })

    it('should perform bulk health check', async () => {
      const requestBody = {
        action: 'bulk',
        listings: [
          {
            listingId: 1,
            title: 'Listing 1',
            description: 'Description 1',
            tags: ['tag1'],
            images: [],
            price: { amount: 1000, divisor: 100 }
          },
          {
            listingId: 2,
            title: 'Listing 2',
            description: 'Description 2',
            tags: ['tag1'],
            images: [],
            price: { amount: 2000, divisor: 100 }
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/tools/health-check', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('result')
      expect(data.data).toHaveProperty('checkedAt')
      expect(data.data.result).toHaveProperty('totalListings', 2)
      expect(data.data.result).toHaveProperty('averageScore')
      expect(data.data.result).toHaveProperty('criticalIssues')
      expect(data.data.result).toHaveProperty('warnings')
      expect(data.data.result).toHaveProperty('topIssues')
      expect(data.data.result).toHaveProperty('categoryScores')
      expect(data.data.result).toHaveProperty('recommendations')
    })

    it('should return error for invalid action', async () => {
      const requestBody = {
        action: 'invalid'
      }

      const request = new NextRequest('http://localhost:3000/api/tools/health-check', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return error for invalid parameters', async () => {
      const requestBody = {
        action: 'single',
        listingId: -1, // Invalid listing ID
        listingData: {}
      }

      const request = new NextRequest('http://localhost:3000/api/tools/health-check', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
