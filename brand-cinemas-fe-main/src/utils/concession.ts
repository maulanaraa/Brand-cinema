import type { ApiConcession, ConcessionItem } from '@/types/concession';
import { resolveDisplayImageUrl } from '@/utils/imageUrl';

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  combo: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=600&q=80',
  popcorn: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80',
  drinks: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
  snacks: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80',
};

export const DEFAULT_CONCESSION_IMAGE =
  'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80';

export function getConcessionImageUrl(imageUrl?: string, category?: string): string {
  const fallback = (category && CATEGORY_FALLBACK_IMAGES[category.toLowerCase()]) || DEFAULT_CONCESSION_IMAGE;
  if (
    !imageUrl ||
    imageUrl.includes('1585647349843-7a2c5e7f1fbb') ||
    imageUrl.includes('1556675593-ef6e8f96773a')
  ) {
    return fallback;
  }
  return resolveDisplayImageUrl(imageUrl, fallback);
}

export function toConcessionItem(api: ApiConcession): ConcessionItem {
  return {
    id: api._id,
    name: api.name,
    description: api.description,
    price: api.price,
    category: api.category,
    imageUrl: getConcessionImageUrl(api.imageUrl, api.category),
    badge: api.badge,
    isActive: api.isActive,
    sortOrder: api.sortOrder ?? 0,
  };
}
