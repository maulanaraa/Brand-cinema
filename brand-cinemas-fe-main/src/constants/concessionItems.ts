import type { ConcessionCategory } from '@/types/concession';

export const CONCESSION_CATEGORIES: Record<
  ConcessionCategory,
  { label: string; description: string }
> = {
  combo: { label: 'Combo Hemat', description: 'Paket popcorn & minuman' },
  popcorn: { label: 'Popcorn', description: 'Freshly popped' },
  drinks: { label: 'Minuman', description: 'Dingin & segar' },
  snacks: { label: 'Snack', description: 'Camilan favorit' },
};

export const CONCESSION_CATEGORY_OPTIONS = (
  Object.keys(CONCESSION_CATEGORIES) as ConcessionCategory[]
).map((value) => ({
  value,
  label: CONCESSION_CATEGORIES[value].label,
}));
