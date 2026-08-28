import type { IFoodItem } from '@/types';
import type { ConcessionCategory, ConcessionItem, CreateConcessionInput } from '@/types/concession';
import { concessionService } from './concessionService';

const categoryToFood: Record<ConcessionCategory, IFoodItem['category']> = {
  popcorn: 'popcorn',
  drinks: 'minuman',
  snacks: 'snack',
  combo: 'snack',
};

const categoryFromFood: Record<IFoodItem['category'], ConcessionCategory> = {
  popcorn: 'popcorn',
  minuman: 'drinks',
  snack: 'snacks',
};

function toFoodItem(item: ConcessionItem): IFoodItem {
  const now = new Date().toISOString();
  return {
    _id: item.id,
    name: item.name,
    price: item.price,
    category: categoryToFood[item.category] ?? 'snack',
    image_url: item.imageUrl,
    is_available: item.isActive,
    createdAt: now,
    updatedAt: now,
  };
}

function toCreateInput(data: Omit<IFoodItem, '_id' | 'createdAt' | 'updatedAt'>): CreateConcessionInput {
  return {
    name: data.name,
    description: data.name,
    price: data.price,
    category: categoryFromFood[data.category] ?? 'snacks',
    imageUrl: data.image_url,
    isActive: data.is_available,
  };
}

export const foodService = {
  async getFoodItems() {
    const items = await concessionService.getConcessions();
    return items.map(toFoodItem);
  },

  async getFoodItemById(id: string) {
    const item = await concessionService.getConcessionById(id);
    return toFoodItem(item);
  },

  async createFoodItem(data: Omit<IFoodItem, '_id' | 'createdAt' | 'updatedAt'>) {
    const item = await concessionService.createConcession(toCreateInput(data));
    return toFoodItem(item);
  },

  async updateFoodItem(id: string, data: Partial<IFoodItem>) {
    const payload: Partial<CreateConcessionInput> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.price !== undefined) payload.price = data.price;
    if (data.image_url !== undefined) payload.imageUrl = data.image_url;
    if (data.is_available !== undefined) payload.isActive = data.is_available;
    if (data.category !== undefined) payload.category = categoryFromFood[data.category] ?? 'snacks';

    const item = await concessionService.updateConcession(id, payload);
    return toFoodItem(item);
  },

  async deleteFoodItem(id: string) {
    await concessionService.deleteConcession(id);
  },
};
