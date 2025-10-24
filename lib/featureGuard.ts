import { flags } from './flags';
import { notFound } from 'next/navigation';

export function requireFeature(feature: keyof typeof flags) {
  if (!flags[feature]) {
    notFound();
  }
}
