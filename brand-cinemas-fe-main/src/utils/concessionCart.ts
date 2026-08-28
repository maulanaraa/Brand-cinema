import type { ConcessionCartLine, ConcessionItem } from '@/types/concession';

const cartKey = (bookingId: string) => `concession-cart:${bookingId}`;

function itemMap(items: ConcessionItem[]) {
  return new Map(items.map((item) => [item.id, item]));
}

export function getConcessionCart(bookingId: string): ConcessionCartLine[] {
  try {
    const raw = sessionStorage.getItem(cartKey(bookingId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConcessionCartLine[];
    return Array.isArray(parsed) ? parsed.filter((l) => l.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function saveConcessionCart(bookingId: string, lines: ConcessionCartLine[]) {
  const filtered = lines.filter((l) => l.quantity > 0);
  if (filtered.length === 0) {
    sessionStorage.removeItem(cartKey(bookingId));
    return;
  }
  sessionStorage.setItem(cartKey(bookingId), JSON.stringify(filtered));
}

export function clearConcessionCart(bookingId: string) {
  sessionStorage.removeItem(cartKey(bookingId));
}

/** Drop cart lines whose items are no longer in the catalog (deleted / deactivated). */
export function pruneConcessionCart(
  bookingId: string,
  availableItems: ConcessionItem[],
): ConcessionCartLine[] {
  const availableIds = new Set(availableItems.map((item) => item.id));
  const pruned = getConcessionCart(bookingId).filter((line) => availableIds.has(line.itemId));
  saveConcessionCart(bookingId, pruned);
  return pruned;
}

export function calculateConcessionTotal(lines: ConcessionCartLine[], items: ConcessionItem[]) {
  const byId = itemMap(items);
  return lines.reduce((sum, line) => {
    const item = byId.get(line.itemId);
    return sum + (item?.price ?? 0) * line.quantity;
  }, 0);
}

export function getConcessionCartDetails(lines: ConcessionCartLine[], items: ConcessionItem[]) {
  const byId = itemMap(items);
  return lines
    .map((line) => {
      const item = byId.get(line.itemId);
      if (!item) return null;
      return {
        ...item,
        quantity: line.quantity,
        subtotal: item.price * line.quantity,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

export function groupConcessionsByCategory(items: ConcessionItem[]) {
  const grouped = new Map<string, ConcessionItem[]>();
  for (const item of items) {
    const list = grouped.get(item.category) ?? [];
    list.push(item);
    grouped.set(item.category, list);
  }
  return grouped;
}

export function toBookingConcessionLines(lines: ConcessionCartLine[]) {
  return lines.map((line) => ({
    concessionId: line.itemId,
    quantity: line.quantity,
  }));
}
