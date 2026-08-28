import type { IHall } from '@/types';
import type { ApiHall, CreateHallInput } from '@/types/hall';

export function toHall(api: ApiHall): IHall {
  return {
    _id: api._id,
    hall_name: api.name ?? api.hallName ?? api.hall_name ?? '',
    total_seats: api.totalSeats ?? api.total_seats ?? 0,
    layout_rows: api.layoutRows ?? api.layout_rows ?? 0,
    layout_columns: api.layoutColumns ?? api.layout_columns ?? 0,
    is_active: api.isActive ?? api.is_active ?? true,
    createdAt: api.createdAt ?? '',
    updatedAt: api.updatedAt ?? '',
  };
}

export interface HallFormValues {
  hall_name: string;
  total_seats: number;
  layout_rows: number;
  layout_columns: number;
  is_active?: boolean;
}

export function buildHallRequestBody(data: HallFormValues): CreateHallInput {
  return {
    name: data.hall_name.trim(),
    totalSeats: Number(data.total_seats),
    layoutRows: Number(data.layout_rows),
    layoutColumns: Number(data.layout_columns),
    isActive: data.is_active ?? true,
  };
}

export function validateHallLayout(data: HallFormValues): string | null {
  const total = Number(data.total_seats);
  const rows = Number(data.layout_rows);
  const columns = Number(data.layout_columns);

  if (rows < 1 || columns < 1) {
    return 'Rows and columns must be at least 1';
  }

  if (total < 1) {
    return 'Total seats must be at least 1';
  }

  if (rows * columns !== total) {
    return `Total seats (${total}) must equal rows × columns (${rows} × ${columns} = ${rows * columns})`;
  }

  return null;
}
