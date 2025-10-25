export const flags = {
  myListings: process.env.NEXT_PUBLIC_ENABLE_MY_LISTINGS === 'true',
  keywords: process.env.NEXT_PUBLIC_ENABLE_KEYWORDS === 'true',
  keywordRanking: process.env.NEXT_PUBLIC_ENABLE_KEYWORD_RANKING === 'true',
  finances: process.env.NEXT_PUBLIC_ENABLE_FINANCES === 'true',
  pinterest: process.env.NEXT_PUBLIC_ENABLE_PINTEREST === 'true',
  analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  ga4Analytics: process.env.NEXT_PUBLIC_ENABLE_GA4_ANALYTICS === 'true',
  communication: process.env.NEXT_PUBLIC_ENABLE_COMMUNICATION === 'true',
  inventory: process.env.NEXT_PUBLIC_ENABLE_INVENTORY === 'true',
  tools: process.env.NEXT_PUBLIC_ENABLE_TOOLS === 'true',
  templates: process.env.NEXT_PUBLIC_ENABLE_TEMPLATES === 'true',
  drafts: process.env.NEXT_PUBLIC_ENABLE_DRAFTS === 'true',
  etsy: process.env.NEXT_PUBLIC_ENABLE_ETSY === 'true',
  savedListings: process.env.NEXT_PUBLIC_ENABLE_SAVED_LISTINGS === 'true',
  developerMode: process.env.NEXT_PUBLIC_DEVELOPER_MODE === 'true',
} as const;

export type FeatureKey = keyof typeof flags;
export const isEnabled = (k: FeatureKey) => flags[k];
