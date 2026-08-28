import type { ApiConcession, ConcessionItem } from '@/types/concession';
import { resolveDisplayImageUrl } from '@/utils/imageUrl';

const PLACEHOLDER_IMAGE =
  'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop';

export function getConcessionImageUrl(imageUrl?: string): string {
  return resolveDisplayImageUrl(imageUrl, PLACEHOLDER_IMAGE);
}

export function toConcessionItem(api: ApiConcession): ConcessionItem {
  return {
    id: api._id,
    name: api.name,
    description: api.description,
    price: api.price,
    category: api.category,
    imageUrl: getConcessionImageUrl(api.imageUrl),
    badge: api.badge,
    isActive: api.isActive,
    sortOrder: api.sortOrder ?? 0,
  };
}
