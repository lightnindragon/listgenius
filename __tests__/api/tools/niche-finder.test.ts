import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/tools/niche-finder/route'

// Mock the auth function
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => Promise.resolve({ userId: 'test-user-id' }))
}))

describe('/api/tools/niche-finder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should get trending niches', async () => {
      const request = new NextRequest('http://localhost:3000/api/tools/niche-finder?action=trending&limit=5')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('niches')
      expect(data.data).toHaveProperty('total')
      expect(Array.isArray(data.data.niches)).toBe(true)
    })

    it('should get personalized niches', async () => {
      const request = new NextRequest('http://localhost:3000/api/tools/niche-finder?action=personalized&limit=5')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('niches')
      expect(data.data).toHaveProperty('total')
      expect(Array.isArray(data.data.niches)).toBe(true)
    })

    it('should return error for invalid action', async () => {
      const request = new NextRequest('http://localhost:3000/api/tools/niche-finder?action=invalid')
      const response = await GET(request)

      expect(response.status).toBe(400)
    })
  })

  describe('POST', () => {
    it('should find niches with filters', async () => {
      const requestBody = {
        action: 'find',
        filters: {
          categories: ['Home & Living'],
          minDemand: 70,
          maxCompetition: 50
        },
        limit: 10
      }

      const request = new NextRequest('http://localhost:3000/api/tools/niche-finder', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('niches')
      expect(data.data).toHaveProperty('total')
      expect(data.data).toHaveProperty('filters')
      expect(data.data).toHaveProperty('searchedAt')
      expect(Array.isArray(data.data.niches)).toBe(true)
    })

    it('should analyze a specific niche', async () => {
      const requestBody = {
        action: 'analyze',
        niche: 'handmade jewelry'
      }

      const request = new NextRequest('http://localhost:3000/api/tools/niche-finder', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('niche')
      expect(data.data).toHaveProperty('analyzedAt')
      expect(data.data.niche).toHaveProperty('niche', 'handmade jewelry')
    })

    it('should return error for invalid action', async () => {
      const requestBody = {
        action: 'invalid'
      }

      const request = new NextRequest('http://localhost:3000/api/tools/niche-finder', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return error for invalid parameters', async () => {
      const requestBody = {
        action: 'analyze',
        niche: '' // Empty niche should fail validation
      }

      const request = new NextRequest('http://localhost:3000/api/tools/niche-finder', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
