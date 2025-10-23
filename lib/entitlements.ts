type Plan = 'free' | 'pro' | 'business';

export const PLAN_CONFIG: Record<Plan, {
  maxGenerationsPerMonth: number | 'unlimited';
  allowedTones: string[];
  allowedWordCounts: number[];
  canSaveGenerations: boolean;
  canAccessRewrites: boolean;
}> = {
  free: {
    maxGenerationsPerMonth: 6,
    allowedTones: ['Professional'],
    allowedWordCounts: [200],
    canSaveGenerations: true,
    canAccessRewrites: false,
  },
  pro: {
    maxGenerationsPerMonth: 'unlimited', // soft cap 1000 in quota check
    allowedTones: ['Professional', 'Friendly', 'Casual', 'Formal', 'Enthusiastic', 'Warm', 'Creative', 'Luxury', 'Playful', 'Minimalist', 'Artistic', 'Rustic', 'Modern', 'Vintage', 'Elegant'],
    allowedWordCounts: [200,300,400,500,600],
    canSaveGenerations: true,
    canAccessRewrites: false, // disabled for everyone until Etsy ready
  },
  business: {
    maxGenerationsPerMonth: 'unlimited', // soft cap 1000 in quota check
    allowedTones: ['Professional', 'Friendly', 'Casual', 'Formal', 'Enthusiastic', 'Warm', 'Creative', 'Luxury', 'Playful', 'Minimalist', 'Artistic', 'Rustic', 'Modern', 'Vintage', 'Elegant'],
    allowedWordCounts: [200,300,400,500,600],
    canSaveGenerations: true,
    canAccessRewrites: false, // disabled for everyone until Etsy ready
  }
};

export function getMonthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
}

export async function getUserPlanSimple(user: any): Promise<Plan> {
  const p = (user?.publicMetadata?.plan as string)?.toLowerCase();
  if (p === 'pro') return 'pro';
  if (p === 'business') return 'business';
  return 'free';
}
