import type { ICarouselItem } from '@/types';
import type {
  ApiCarouselItem,
  CreateCarouselInput,
  UpdateCarouselInput,
} from '@/types/carousel';
import { toMovie } from '@/utils/movie';
import { resolveDisplayImageUrl } from '@/utils/imageUrl';

export function getCarouselImageUrl(imageUrl?: string): string {
  return resolveDisplayImageUrl(
    imageUrl,
    'https://placehold.co/1600x900/0f172a/94a3b8?text=Carousel',
  );
}

export function toCarouselItem(api: ApiCarouselItem): ICarouselItem {
  const movieId = api.movieId ?? api.movie_id ?? api.movie?._id ?? undefined;
  const movie = api.movie ? toMovie(api.movie) : undefined;
  const linkUrl = api.linkUrl ?? api.link_url ?? (movieId ? `/movies/${movieId}` : undefined);

  return {
    _id: String(api._id),
    type: api.type,
    title: api.title ?? '',
    description: api.description,
    image_url: getCarouselImageUrl(api.imageUrl ?? api.image_url),
    link_url: linkUrl,
    movie_id: movieId ?? undefined,
    movie,
    is_active: api.isActive ?? api.is_active ?? true,
    order: api.order ?? api.sortOrder ?? 0,
    createdAt: api.createdAt ?? '',
    updatedAt: api.updatedAt ?? '',
  };
}

export function normalizeCarouselListPayload(data: {
  items?: ApiCarouselItem[];
  carousel?: ApiCarouselItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}): {
  items: ApiCarouselItem[];
  pagination: NonNullable<typeof data.pagination>;
} {
  return {
    items: data.items ?? data.carousel ?? [],
    pagination: data.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 1 },
  };
}

export interface CarouselFormValues {
  type: 'movie' | 'promotion';
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  movie_id?: string;
  is_active?: boolean;
  order?: number | string;
}

export function buildCarouselRequestBody(
  data: CarouselFormValues,
): CreateCarouselInput {
  const title = data.title.trim();
  const description = data.description?.trim();
  const imageUrl = data.image_url.trim();
  const linkUrl = data.link_url?.trim();
  const movieId = data.movie_id?.trim();

  return {
    type: data.type,
    title,
    imageUrl,
    ...(description ? { description } : {}),
    ...(linkUrl ? { linkUrl } : {}),
    ...(data.type === 'movie' && movieId ? { movieId } : { movieId: null }),
    isActive: data.is_active ?? true,
    order: Number(data.order ?? 1),
  };
}

export function buildCarouselUpdateBody(
  data: Partial<CarouselFormValues>,
): UpdateCarouselInput {
  const body: UpdateCarouselInput = {};

  if (data.type !== undefined) body.type = data.type;
  if (data.title !== undefined) body.title = data.title.trim();
  if (data.description !== undefined) {
    const description = data.description.trim();
    body.description = description || undefined;
  }
  if (data.image_url !== undefined) body.imageUrl = data.image_url.trim();
  if (data.link_url !== undefined) {
    const linkUrl = data.link_url.trim();
    body.linkUrl = linkUrl || undefined;
  }
  if (data.movie_id !== undefined) {
    const movieId = data.movie_id.trim();
    body.movieId = movieId || null;
  }
  if (data.is_active !== undefined) body.isActive = data.is_active;
  if (data.order !== undefined) body.order = Number(data.order);

  return body;
}

/** Resolve CTA / details path for a carousel slide. */
export function getCarouselMoviePath(item: ICarouselItem): string | undefined {
  if (item.movie?._id) return `/movies/${item.movie._id}`;
  if (item.movie_id) return `/movies/${item.movie_id}`;
  if (item.link_url?.startsWith('/movies/')) return item.link_url;
  return undefined;
}
