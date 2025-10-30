/**
 * Blog Quality Check Prompt
 * Comprehensive SEO and content quality assessment
 */

import { BLOG_AUTOMATION_CONFIG, QualityFeedback } from '@/lib/blog-automation-config';

export const BLOG_QUALITY_CHECK_SYSTEM_PROMPT = `You are an expert SEO quality auditor and content reviewer for ListGenius blog content.

Your role is to evaluate blog posts for:
1. SEO completeness and optimization
2. Content quality and value for Etsy sellers
3. Brand voice alignment
4. Internal linking quality

EVALUATION CRITERIA:

1. SEO COMPLETENESS (40 points):
   - All required fields present and properly formatted
   - Title: 50-60 chars, keyword present (5 pts)
   - Slug: URL-friendly, keyword-rich (3 pts)
   - Excerpt: 150-160 chars, compelling (5 pts)
   - Content: 1000+ words, structured (10 pts)
   - seoTitle: 55-60 chars, optimized (5 pts)
   - seoDescription: 150-160 chars, keyword + CTA (5 pts)
   - seoKeywords: 8-12 relevant keywords (5 pts)
   - Tags: 5-8 appropriate tags (2 pts)

2. KEYWORD OPTIMIZATION (30 points):
   - Primary keyword density: 1-2% (10 pts)
   - Keyword in first paragraph (5 pts)
   - Keywords in headings (H2/H3) (5 pts)
   - Secondary keywords present (5 pts)
   - LSI keywords included (5 pts)

3. CONTENT QUALITY (20 points):
   - Target: Etsy SELLERS only (5 pts)
   - Actionable, valuable content (5 pts)
   - Clear structure with H2/H3 (5 pts)
   - Readability (Flesch > 60) (5 pts)

4. INTERNAL LINKING (10 points):
   - 2-3 natural, relevant links (5 pts)
   - Non-salesy, value-driven (5 pts)

TARGET AUDIENCE VALIDATION:
- Content must be for Etsy SELLERS (shop owners, creators, entrepreneurs)
- NO content for buyers, shoppers, or customers
- Focus on business growth, optimization, and sales strategies

OUTPUT FORMAT:
Return ONLY valid JSON with detailed feedback. No other text.`;

export const BLOG_QUALITY_CHECK_USER_PROMPT = (blogPost: any, primaryKeyword: string, secondaryKeywords: string[]): string => {
  return `Evaluate this blog post for SEO quality and content value:

BLOG POST DATA:
Title: ${blogPost.title || 'MISSING'}
Slug: ${blogPost.slug || 'MISSING'}
Excerpt: ${blogPost.excerpt || 'MISSING'}
Content Length: ${blogPost.content?.length || 0} characters
SEO Title: ${blogPost.seoTitle || 'MISSING'}
SEO Description: ${blogPost.seoDescription || 'MISSING'}
SEO Keywords: ${JSON.stringify(blogPost.seoKeywords || [])}
Tags: ${JSON.stringify(blogPost.tags || [])}
Category: ${blogPost.category || 'MISSING'}

CONTENT:
${blogPost.content || 'MISSING'}

PRIMARY KEYWORD: ${primaryKeyword}
SECONDARY KEYWORDS: ${secondaryKeywords.join(', ')}

EVALUATION REQUIREMENTS:
1. Check ALL required fields are present and properly formatted
2. Verify keyword optimization (density, placement, headings)
3. Ensure content targets Etsy SELLERS (not buyers)
4. Assess content quality (actionable, valuable, readable)
5. Evaluate internal links (natural, relevant, non-promotional)

OUTPUT FORMAT:
Return valid JSON with detailed scoring and feedback:
{
  "approved": boolean,
  "score": number (0-100),
  "feedback": {
    "seo": {
      "score": number,
      "issues": ["list of SEO issues"],
      "suggestions": ["list of SEO improvements"]
    },
    "keywords": {
      "score": number,
      "density": number,
      "placement": ["list of placement issues"],
      "suggestions": ["list of keyword improvements"]
    },
    "content": {
      "score": number,
      "readability": number,
      "structure": ["list of structure issues"],
      "suggestions": ["list of content improvements"]
    },
    "links": {
      "score": number,
      "count": number,
      "quality": ["list of link quality issues"],
      "suggestions": ["list of link improvements"]
    }
  },
  "suggestions": ["overall improvement suggestions"],
  "missingFields": ["list of missing required fields"],
  "seoIssues": ["list of critical SEO issues"]
}

SCORING GUIDELINES:
- 90-100: Excellent, ready to publish
- 80-89: Good, minor improvements needed
- 70-79: Acceptable, some improvements needed
- 60-69: Needs revision, significant improvements needed
- Below 60: Reject, major issues to address

Remember: This content must be for Etsy SELLERS, not buyers. Focus on business growth and optimization.`;
};

export const BLOG_QUALITY_CHECK_MODEL_CONFIG = {
  model: 'gpt-4o',
  temperature: 0.3, // Lower temperature for consistent evaluation
  max_tokens: 2000,
  top_p: 0.8,
  response_format: { type: 'json_object' }
};

export interface QualityCheckResult {
  approved: boolean;
  score: number;
  feedback: QualityFeedback;
  suggestions: string[];
  missingFields: string[];
  seoIssues: string[];
}

export function validateQualityCheckResult(result: any): result is QualityCheckResult {
  if (!result || typeof result !== 'object') return false;
  
  const requiredFields = ['approved', 'score', 'feedback', 'suggestions', 'missingFields', 'seoIssues'];
  for (const field of requiredFields) {
    if (!(field in result)) return false;
  }
  
  if (typeof result.approved !== 'boolean') return false;
  if (typeof result.score !== 'number' || result.score < 0 || result.score > 100) return false;
  if (!Array.isArray(result.suggestions)) return false;
  if (!Array.isArray(result.missingFields)) return false;
  if (!Array.isArray(result.seoIssues)) return false;
  
  // Validate feedback structure
  const feedback = result.feedback;
  if (!feedback || typeof feedback !== 'object') return false;
  
  const feedbackSections = ['seo', 'keywords', 'content', 'links'];
  for (const section of feedbackSections) {
    if (!(section in feedback)) return false;
    const sectionData = feedback[section];
    if (!sectionData || typeof sectionData !== 'object') return false;
    if (typeof sectionData.score !== 'number') return false;
    if (!Array.isArray(sectionData.issues || sectionData.suggestions)) return false;
  }
  
  return true;
}

export function calculateReadabilityScore(text: string): number {
  // Simple Flesch Reading Ease approximation
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((acc, word) => acc + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, score));
}

function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  const vowels = 'aeiouy';
  let count = 0;
  let previousWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }
  
  // Handle silent 'e'
  if (word.endsWith('e')) count--;
  
  return Math.max(1, count);
}

export function extractInternalLinks(content: string): { url: string; anchor: string; context: string }[] {
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  const links: { url: string; anchor: string; context: string }[] = [];
  
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[1];
    const anchor = match[2].replace(/<[^>]*>/g, '').trim();
    
    // Extract context (sentence containing the link)
    const beforeLink = content.substring(0, match.index);
    const afterLink = content.substring(match.index + match[0].length);
    const sentenceStart = beforeLink.lastIndexOf('.') + 1;
    const sentenceEnd = afterLink.indexOf('.') + match.index + match[0].length;
    const context = content.substring(sentenceStart, sentenceEnd).trim();
    
    links.push({ url, anchor, context });
  }
  
  return links;
}
