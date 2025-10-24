/**
 * Listing Quality Scoring System
 * Provides comprehensive 0-100 scoring for Etsy listings
 */

export interface ListingScoreBreakdown {
  totalScore: number;
  breakdown: {
    title: { score: number; maxPoints: number; feedback: string[] };
    description: { score: number; maxPoints: number; feedback: string[] };
    tags: { score: number; maxPoints: number; feedback: string[] };
    materials: { score: number; maxPoints: number; feedback: string[] };
    images: { score: number; maxPoints: number; feedback: string[] };
    altText: { score: number; maxPoints: number; feedback: string[] };
    shipping: { score: number; maxPoints: number; feedback: string[] };
  };
  recommendations: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface ListingData {
  title?: string;
  description?: string;
  tags?: string[];
  materials?: string[];
  images?: Array<{
    url?: string;
    width?: number;
    height?: number;
    alt_text?: string;
  }>;
  shippingProfile?: string;
  processingTime?: {
    min: number;
    max: number;
  };
  price?: number;
  quantity?: number;
  shopSection?: string;
}

/**
 * Calculate comprehensive listing quality score (0-100)
 */
export function calculateListingScore(listing: ListingData): ListingScoreBreakdown {
  const breakdown = {
    title: calculateTitleScore(listing.title || ''),
    description: calculateDescriptionScore(listing.description || ''),
    tags: calculateTagsScore(listing.tags || []),
    materials: calculateMaterialsScore(listing.materials || []),
    images: calculateImagesScore(listing.images || []),
    altText: calculateAltTextScore(listing.images || []),
    shipping: calculateShippingScore(listing),
  };

  const totalScore = Object.values(breakdown).reduce((sum, section) => sum + section.score, 0);
  const recommendations = generateRecommendations(breakdown);
  const priority = determinePriority(totalScore);

  return {
    totalScore: Math.round(totalScore),
    breakdown,
    recommendations,
    priority,
  };
}

/**
 * Title scoring (15 points max)
 */
function calculateTitleScore(title: string): { score: number; maxPoints: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  // Length check (5 points)
  const wordCount = title.split(/\s+/).filter(word => word.length > 0).length;
  if (wordCount >= 5 && wordCount <= 15) {
    score += 5;
  } else if (wordCount > 15) {
    score += 2;
    feedback.push('Title is too long (>15 words). Etsy recommends 5-15 words.');
  } else if (wordCount < 5) {
    score += 1;
    feedback.push('Title is too short. Add more descriptive words.');
  }

  // Focus keyword check (5 points)
  const hasFocusKeywords = /handmade|unique|vintage|custom|personalized/i.test(title);
  if (hasFocusKeywords) {
    score += 5;
  } else {
    feedback.push('Consider adding focus keywords like "handmade", "unique", or "custom".');
  }

  // Readability (5 points)
  const hasNumbers = /\d/.test(title);
  const hasSpecialChars = /[^\w\s]/.test(title);
  if (!hasSpecialChars && hasNumbers) {
    score += 5;
  } else if (hasSpecialChars) {
    score += 2;
    feedback.push('Avoid special characters in title for better readability.');
  } else {
    score += 3;
    feedback.push('Consider adding numbers or dimensions to make title more specific.');
  }

  return { score, maxPoints: 15, feedback };
}

/**
 * Description scoring (20 points max)
 */
function calculateDescriptionScore(description: string): { score: number; maxPoints: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  // Word count (8 points)
  const wordCount = description.split(/\s+/).filter(word => word.length > 0).length;
  if (wordCount >= 250 && wordCount <= 600) {
    score += 8;
  } else if (wordCount >= 200 && wordCount < 250) {
    score += 6;
    feedback.push('Description is slightly short. Aim for 250-600 words for better SEO.');
  } else if (wordCount > 600) {
    score += 4;
    feedback.push('Description is too long. Consider breaking into sections.');
  } else {
    score += 2;
    feedback.push('Description is too short. Add more details about the product.');
  }

  // Structure (6 points)
  const hasParagraphs = description.split('\n\n').length > 1;
  const hasBulletPoints = description.includes('•') || description.includes('-');
  if (hasParagraphs && hasBulletPoints) {
    score += 6;
  } else if (hasParagraphs || hasBulletPoints) {
    score += 4;
    feedback.push('Improve description structure with paragraphs and bullet points.');
  } else {
    score += 1;
    feedback.push('Add structure with paragraphs and bullet points for better readability.');
  }

  // Keywords in first 200 words (6 points)
  const first200Words = description.substring(0, 200);
  const keywordDensity = (first200Words.toLowerCase().match(/handmade|unique|artisan|custom/g) || []).length;
  if (keywordDensity >= 2) {
    score += 6;
  } else if (keywordDensity === 1) {
    score += 4;
    feedback.push('Add more focus keywords in the first 200 words.');
  } else {
    score += 1;
    feedback.push('Include focus keywords in the beginning of your description.');
  }

  return { score, maxPoints: 20, feedback };
}

/**
 * Tags scoring (15 points max)
 */
function calculateTagsScore(tags: string[]): { score: number; maxPoints: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  // Count (5 points)
  if (tags.length === 13) {
    score += 5;
  } else if (tags.length >= 10) {
    score += 3;
    feedback.push(`You have ${tags.length} tags. Use all 13 tags for maximum SEO benefit.`);
  } else if (tags.length >= 5) {
    score += 2;
    feedback.push(`Only ${tags.length} tags used. Add more relevant tags.`);
  } else {
    feedback.push(`Only ${tags.length} tags used. Etsy allows up to 13 tags.`);
  }

  // Length check (5 points)
  const validLengthTags = tags.filter(tag => tag.length <= 20 && tag.length > 0);
  if (validLengthTags.length === tags.length) {
    score += 5;
  } else {
    score += Math.round((validLengthTags.length / tags.length) * 5);
    feedback.push('Some tags exceed 20 characters or are empty. Keep tags under 20 characters.');
  }

  // Long-tail keywords (5 points)
  const longTailTags = tags.filter(tag => tag.split(' ').length >= 2);
  if (longTailTags.length >= 5) {
    score += 5;
  } else if (longTailTags.length >= 3) {
    score += 3;
    feedback.push('Add more long-tail keyword tags (2+ words) for better targeting.');
  } else {
    score += 1;
    feedback.push('Include more long-tail keyword tags (2+ words) for specific searches.');
  }

  return { score, maxPoints: 15, feedback };
}

/**
 * Materials scoring (10 points max)
 */
function calculateMaterialsScore(materials: string[]): { score: number; maxPoints: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  // Count (5 points)
  if (materials.length === 13) {
    score += 5;
  } else if (materials.length >= 8) {
    score += 3;
    feedback.push(`You have ${materials.length} materials. Use all 13 for better search visibility.`);
  } else if (materials.length >= 5) {
    score += 2;
    feedback.push(`Add more materials. You have ${materials.length}/13.`);
  } else {
    feedback.push(`Only ${materials.length} materials listed. Add more for better categorization.`);
  }

  // Quality (5 points)
  const qualityMaterials = materials.filter(material => 
    material.length > 3 && 
    !/^(and|or|the|of|in|for|with|by)$/i.test(material.trim())
  );
  if (qualityMaterials.length >= materials.length * 0.8) {
    score += 5;
  } else if (qualityMaterials.length >= materials.length * 0.6) {
    score += 3;
    feedback.push('Some materials are too generic. Be more specific.');
  } else {
    score += 1;
    feedback.push('Materials are too generic. Use specific material names.');
  }

  return { score, maxPoints: 10, feedback };
}

/**
 * Images scoring (25 points max)
 */
function calculateImagesScore(images: Array<{ width?: number; height?: number }>): { score: number; maxPoints: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  // Count (10 points)
  if (images.length >= 5 && images.length <= 10) {
    score += 10;
  } else if (images.length >= 3) {
    score += 7;
    feedback.push(`${images.length} images. Consider adding more (5-10 recommended).`);
  } else if (images.length >= 1) {
    score += 4;
    feedback.push(`Only ${images.length} images. Add more photos to showcase your product.`);
  } else {
    feedback.push('No images found. Add at least 5 high-quality images.');
  }

  // Resolution (15 points)
  const highResImages = images.filter(img => 
    img.width && img.height && 
    (img.width >= 2000 || img.height >= 2000)
  );
  
  if (highResImages.length === images.length && images.length > 0) {
    score += 15;
  } else if (highResImages.length >= images.length * 0.5) {
    score += 10;
    feedback.push('Some images are below 2000x2000px. Higher resolution improves visibility.');
  } else if (highResImages.length > 0) {
    score += 5;
    feedback.push('Most images are below recommended 2000x2000px resolution.');
  } else {
    feedback.push('Images should be at least 2000x2000px for best quality.');
  }

  return { score, maxPoints: 25, feedback };
}

/**
 * Alt text scoring (10 points max)
 */
function calculateAltTextScore(images: Array<{ alt_text?: string }>): { score: number; maxPoints: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  if (images.length === 0) {
    return { score: 0, maxPoints: 10, feedback: ['No images to add alt text to.'] };
  }

  // Coverage (5 points)
  const imagesWithAltText = images.filter(img => img.alt_text && img.alt_text.trim().length > 0);
  const coveragePercentage = imagesWithAltText.length / images.length;
  
  if (coveragePercentage === 1) {
    score += 5;
  } else if (coveragePercentage >= 0.8) {
    score += 4;
    feedback.push(`${Math.round((1 - coveragePercentage) * 100)}% of images missing alt text.`);
  } else if (coveragePercentage >= 0.5) {
    score += 3;
    feedback.push(`${Math.round((1 - coveragePercentage) * 100)}% of images missing alt text.`);
  } else {
    score += 1;
    feedback.push('Most images are missing alt text. Add descriptive alt text for accessibility and SEO.');
  }

  // Quality (5 points)
  const qualityAltText = imagesWithAltText.filter(img => 
    img.alt_text && 
    img.alt_text.length >= 20 && 
    img.alt_text.length <= 250
  );
  
  if (qualityAltText.length === imagesWithAltText.length && imagesWithAltText.length > 0) {
    score += 5;
  } else if (qualityAltText.length >= imagesWithAltText.length * 0.7) {
    score += 4;
    feedback.push('Some alt text could be more descriptive (20-250 characters).');
  } else {
    score += 2;
    feedback.push('Alt text should be descriptive and 20-250 characters long.');
  }

  return { score, maxPoints: 10, feedback };
}

/**
 * Shipping scoring (5 points max)
 */
function calculateShippingScore(listing: ListingData): { score: number; maxPoints: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  // Shipping profile (2 points)
  if (listing.shippingProfile) {
    score += 2;
  } else {
    feedback.push('No shipping profile selected. This is required for listings.');
  }

  // Processing time (3 points)
  if (listing.processingTime) {
    const { min, max } = listing.processingTime;
    if (min <= 3 && max <= 7) {
      score += 3;
    } else if (min <= 5 && max <= 14) {
      score += 2;
      feedback.push('Consider shorter processing times for better customer experience.');
    } else {
      score += 1;
      feedback.push('Long processing times may reduce sales. Consider faster turnaround.');
    }
  } else {
    feedback.push('No processing time specified.');
  }

  return { score, maxPoints: 5, feedback };
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(breakdown: any): string[] {
  const recommendations: string[] = [];

  // High impact improvements
  if (breakdown.images.score < breakdown.images.maxPoints * 0.7) {
    recommendations.push('Add more high-resolution images (2000x2000px+) - this has the biggest impact on sales');
  }

  if (breakdown.description.score < breakdown.description.maxPoints * 0.7) {
    recommendations.push('Expand your description to 250-600 words with better structure');
  }

  if (breakdown.tags.score < breakdown.tags.maxPoints * 0.7) {
    recommendations.push('Use all 13 tags with long-tail keywords for better search visibility');
  }

  if (breakdown.title.score < breakdown.title.maxPoints * 0.7) {
    recommendations.push('Optimize your title with focus keywords and proper length (5-15 words)');
  }

  // Medium impact improvements
  if (breakdown.materials.score < breakdown.materials.maxPoints * 0.8) {
    recommendations.push('Add more specific materials to help customers find your product');
  }

  if (breakdown.altText.score < breakdown.altText.maxPoints * 0.8) {
    recommendations.push('Add descriptive alt text to all images for accessibility and SEO');
  }

  // Shipping improvements
  if (breakdown.shipping.score < breakdown.shipping.maxPoints) {
    recommendations.push('Complete shipping profile and processing time information');
  }

  return recommendations;
}

/**
 * Determine priority level based on total score
 */
function determinePriority(totalScore: number): 'high' | 'medium' | 'low' {
  if (totalScore < 50) return 'high';
  if (totalScore < 75) return 'medium';
  return 'low';
}

/**
 * Get color class for score display
 */
export function getScoreColorClass(score: number): string {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get background color class for score display
 */
export function getScoreBgClass(score: number): string {
  if (score >= 75) return 'bg-green-100';
  if (score >= 50) return 'bg-yellow-100';
  return 'bg-red-100';
}
