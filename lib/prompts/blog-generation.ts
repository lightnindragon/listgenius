/**
 * Blog Content Generation Prompt
 * Comprehensive SEO-optimized content generation for Etsy sellers
 */

import { BLOG_AUTOMATION_CONFIG, BlogGenerationInput, BlogGenerationOutput } from '@/lib/blog-automation-config';

export const BLOG_GENERATION_SYSTEM_PROMPT = `You are an expert SEO content writer for ListGenius, an Etsy listing optimization platform for sellers.

CRITICAL REQUIREMENTS:
- Target audience: Etsy SELLERS (shop owners, creators, entrepreneurs) - NEVER buyers
- Write comprehensive, SEO-optimized content for Google ranking
- Focus on actionable insights for growing Etsy shops and increasing sales
- Professional yet approachable tone (educator, NOT salesperson)

SEO REQUIREMENTS (CRITICAL):
- Primary keyword: Use 3-5 times naturally (1-2% density)
- Secondary keywords: Sprinkle 5-8 times throughout
- First paragraph: Include primary keyword in first 100 words
- Headings: Use keyword-rich H2/H3 tags (4-6 H2 sections)
- Length: 1000-1800 words (sweet spot for SEO)
- LSI keywords: Include semantically related terms
- Readability: Flesch score > 60 (conversational but professional)
- Structure: Introduction → Main sections (H2) → Subsections (H3) → Conclusion with CTA

CONTENT STRUCTURE:
1. Introduction (100-150 words): Hook + primary keyword + value proposition
2. 4-6 H2 sections with H3 subsections covering:
   - Step-by-step guides
   - Actionable tips
   - Real examples
   - Common mistakes to avoid
   - Tools and resources
3. Conclusion (100-150 words): Summary + CTA

INTERNAL LINKING GUIDELINES:
- Mention ListGenius features ONLY when genuinely helpful in context for sellers
- Use phrases like "tools like ListGenius", "automation platforms", "listing generators"
- Include 2-3 subtle links per post maximum
- Never use hard-sell language or urgent CTAs
- Focus on education first, product mentions second
- Links must add value, not feel promotional

OUTPUT FORMAT:
Return ONLY valid JSON matching the BlogGenerationOutput interface. No other text.`;

export const BLOG_GENERATION_USER_PROMPT = (input: BlogGenerationInput): string => {
  return `Generate a comprehensive, SEO-optimized blog post for Etsy sellers with the following specifications:

PRIMARY KEYWORD: ${input.primaryKeyword}
SECONDARY KEYWORDS: ${input.secondaryKeywords.join(', ')}
CATEGORY: ${input.category}

CONTENT REQUIREMENTS:
- Target audience: Etsy SELLERS (shop owners, creators, entrepreneurs)
- Word count: 1000-1800 words
- Structure: Introduction + 4-6 H2 sections + Conclusion
- Tone: Professional, helpful, empowering (NOT promotional)
- Focus: Actionable insights for growing Etsy shops and increasing sales

SEO OPTIMIZATION:
- Use primary keyword 3-5 times naturally (1-2% density)
- Include primary keyword in first paragraph
- Use keyword-rich H2/H3 headings
- Sprinkle secondary keywords throughout content
- Include LSI keywords naturally

INTERNAL LINKING:
- Include 2-3 contextual links to ListGenius pages when relevant
- Suggested links: ${input.internalLinkSuggestions.map(link => `${link.url} (${link.anchor})`).join(', ')}
- Make links natural and value-adding, not promotional

OUTPUT FORMAT:
Return valid JSON with all required fields:
{
  "title": "50-60 chars, keyword + benefit",
  "slug": "url-friendly-keyword-rich-slug", 
  "excerpt": "150-160 chars, keyword + compelling hook",
  "content": "1000-1800 words HTML with H2/H3/lists/bold/links",
  "seoTitle": "55-60 chars, keyword-front-loaded",
  "seoDescription": "150-160 chars, keyword + CTA",
  "seoKeywords": ["8-12 keywords array"],
  "tags": ["5-8 internal tags"],
  "category": "${input.category}",
  "featuredImage": "placeholder-url",
  "internalLinks": [
    {"url": "/app/generator", "anchor": "listing generator", "context": "sentence with link"}
  ],
  "targetKeywordDensity": 1.5
}

Remember: This content is for Etsy SELLERS, not buyers. Focus on helping them grow their business, optimize their shop, and increase sales.`;
};

export const BLOG_GENERATION_MODEL_CONFIG = {
  model: 'gpt-4o',
  temperature: 0.7,
  max_tokens: 4000,
  top_p: 0.9,
  response_format: { type: 'json_object' }
};

export function validateBlogGenerationOutput(output: any): output is BlogGenerationOutput {
  if (!output || typeof output !== 'object') return false;
  
  const requiredFields = [
    'title', 'slug', 'excerpt', 'content', 'seoTitle', 
    'seoDescription', 'seoKeywords', 'tags', 'category', 
    'featuredImage', 'internalLinks', 'targetKeywordDensity'
  ];
  
  for (const field of requiredFields) {
    if (!(field in output)) return false;
  }
  
  // Validate field types and constraints
  if (typeof output.title !== 'string' || output.title.length < 50 || output.title.length > 60) return false;
  if (typeof output.slug !== 'string' || output.slug.length > 60) return false;
  if (typeof output.excerpt !== 'string' || output.excerpt.length < 150 || output.excerpt.length > 160) return false;
  if (typeof output.content !== 'string' || output.content.length < 1000) return false;
  if (typeof output.seoTitle !== 'string' || output.seoTitle.length < 55 || output.seoTitle.length > 60) return false;
  if (typeof output.seoDescription !== 'string' || output.seoDescription.length < 150 || output.seoDescription.length > 160) return false;
  if (!Array.isArray(output.seoKeywords) || output.seoKeywords.length < 8 || output.seoKeywords.length > 12) return false;
  if (!Array.isArray(output.tags) || output.tags.length < 5 || output.tags.length > 8) return false;
  if (typeof output.category !== 'string') return false;
  if (typeof output.featuredImage !== 'string') return false;
  if (!Array.isArray(output.internalLinks)) return false;
  if (typeof output.targetKeywordDensity !== 'number') return false;
  
  return true;
}

export function calculateKeywordDensity(content: string, keyword: string): number {
  const words = content.toLowerCase().split(/\s+/);
  const keywordCount = words.filter(word => word.includes(keyword.toLowerCase())).length;
  return (keywordCount / words.length) * 100;
}

export function extractHeadings(content: string): { h2: string[], h3: string[] } {
  const h2Matches = content.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
  const h3Matches = content.match(/<h3[^>]*>(.*?)<\/h3>/gi) || [];
  
  return {
    h2: h2Matches.map(h => h.replace(/<[^>]*>/g, '').trim()),
    h3: h3Matches.map(h => h.replace(/<[^>]*>/g, '').trim())
  };
}
