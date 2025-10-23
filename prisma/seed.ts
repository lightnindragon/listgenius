/**
 * Database seed file for initial data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default weights configuration
  const defaultWeights = await prisma.weightsConfig.upsert({
    where: { version: 'v1.0-default' },
    update: {},
    create: {
      version: 'v1.0-default',
      isActive: true,
      w1_suggest: 0.3,    // 30% - Autocomplete suggestions
      w2_serp: 0.4,       // 40% - SERP result count
      w3_trends: 0.3,     // 30% - Google Trends
      c1_listings: 0.4,   // 40% - Active listings
      c2_shopConc: 0.35,  // 35% - Shop concentration
      c3_titleExact: 0.25, // 25% - Title exact matches
      s1_variance: 0.6,   // 60% - Seasonality variance
      s2_peak: 0.4,       // 40% - Peak seasonality
    },
  });

  console.log('✅ Created default weights configuration:', defaultWeights.version);

  // Create sample keywords for testing
  const sampleKeywords = [
    'handmade jewelry',
    'vintage clothing',
    'home decor',
    'art prints',
    'ceramic mugs',
    'wooden cutting boards',
    'macrame wall hanging',
    'leather wallet',
    'crochet blanket',
    'polymer clay earrings',
    'linen table runner',
    'terrarium plants',
    'handwoven basket',
    'soy candle',
    'embroidered pillow',
  ];

  for (const keyword of sampleKeywords) {
    const keywordRecord = await prisma.keyword.upsert({
      where: { term: keyword },
      update: {},
      create: {
        term: keyword,
        language: 'en-US',
      },
    });

    // Create sample metrics for each keyword
    const today = new Date();
    const metricsData = {
      keywordId: keywordRecord.id,
      date: today,
      activeListings: Math.floor(Math.random() * 1000) + 100,
      suggestStrength: Math.random() * 100,
      page1ShopConc: Math.random() * 50,
      titleExactRate: Math.random() * 30,
      trendsIdx: Math.random() * 100,
      demand: Math.random() * 100,
      competition: Math.random() * 100,
      seasonality: Math.random() * 100,
      opportunity: Math.random() * 100,
      difficulty: Math.floor(Math.random() * 100),
    };

    await prisma.keywordMetricsDaily.upsert({
      where: {
        keywordId_date: {
          keywordId: keywordRecord.id,
          date: today,
        },
      },
      update: metricsData,
      create: metricsData,
    });

    // Create sample similar keywords
    const similarKeywords = [
      `${keyword} for sale`,
      `${keyword} handmade`,
      `${keyword} unique`,
      `custom ${keyword}`,
      `${keyword} gift`,
    ];

    for (const similar of similarKeywords) {
      await prisma.keywordSimilar.upsert({
        where: {
          keywordId_relatedTerm: {
            keywordId: keywordRecord.id,
            relatedTerm: similar,
          },
        },
        update: {},
        create: {
          keywordId: keywordRecord.id,
          relatedTerm: similar,
          relevance: Math.random(),
          source: 'autocomplete',
        },
      });
    }
  }

  console.log('✅ Created sample keywords and metrics');

  // Create sample competitor shops
  const sampleShops = [
    { shopId: 12345678, shopName: 'ArtisanCraftStudio' },
    { shopId: 87654321, shopName: 'VintageTreasuresCo' },
    { shopId: 11223344, shopName: 'HandmadeHaven' },
    { shopId: 44332211, shopName: 'CreativeCorner' },
    { shopId: 55667788, shopName: 'UniqueFindsShop' },
  ];

  for (const shop of sampleShops) {
    await prisma.competitorShop.upsert({
      where: { shopId: BigInt(shop.shopId) },
      update: {},
      create: {
        shopId: BigInt(shop.shopId),
        shopName: shop.shopName,
        userId: 'sample-user-id', // This would be replaced with actual user IDs
      },
    });

    // Create sample competitor snapshots
    const snapshotData = {
      competitorShopId: (await prisma.competitorShop.findUnique({
        where: { shopId: BigInt(shop.shopId) },
      }))!.id,
      date: new Date(),
      activeListings: Math.floor(Math.random() * 200) + 50,
      avgPrice: Math.random() * 100 + 20,
      estimatedSales: Math.floor(Math.random() * 1000) + 100,
      topKeywords: sampleKeywords.slice(0, Math.floor(Math.random() * 5) + 3),
    };

    await prisma.competitorSnapshot.create({
      data: snapshotData,
    });
  }

  console.log('✅ Created sample competitor shops and snapshots');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
