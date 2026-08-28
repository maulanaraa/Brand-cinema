# Carousel API

Status: **Integrated** — backend (`booking-be`) and frontend are wired.

Purpose: manage homepage carousel slides (`movie` | `promotion`) from `/admin/carousel`, and serve active slides to the landing page hero.

## Shared response envelope

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Human readable error",
  "errors": ["optional field errors"]
}
```

## Auth

| Action | Auth |
|--------|------|
| `GET /api/carousel/active` | Public |
| `GET /api/carousel` (default `isActive=true`) | Public |
| `GET /api/carousel?isActive=all` or `false` | Admin session cookie |
| `GET /api/carousel/:id` | Admin |
| `POST` / `PUT` / `DELETE` / reorder | Admin session cookie |

Use the same cookie session as other admin routes (`credentials: 'include'`).

## Endpoint summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/carousel/active` | Public | Active slides sorted by `order` asc → `{ items }` |
| GET | `/api/carousel` | Public / Admin | List with filters → `{ items, pagination }` (default `limit=20`) |
| GET | `/api/carousel/:id` | Admin | Single item |
| POST | `/api/carousel` | Admin | Create |
| PUT | `/api/carousel/:id` | Admin | Update |
| DELETE | `/api/carousel/:id` | Admin | Hard delete |
| PUT | `/api/carousel/reorder` | Admin | `{ orderedIds }` → `order = index + 1` |

---

## Data model

| Field | Type | Notes |
|-------|------|-------|
| `_id` | string | Mongo id |
| `type` | `"movie"` \| `"promotion"` | Required |
| `title` | string | Required |
| `description` | string | Optional |
| `imageUrl` | string | Absolute URL, `/uploads/...`, or `data:image/...;base64,...` |
| `linkUrl` | string | Optional CTA / promo URL |
| `movieId` | string \| null | Optional; soft-deleted movies keep id but `movie` is `null` |
| `movie` | object \| null | Populated when `movieId` is set |
| `isActive` | boolean | Default `true`; only active slides on homepage |
| `order` | number | Sort key (1-based from reorder) |
| `createdAt` / `updatedAt` | ISO string | |

Frontend also accepts snake_case aliases (`image_url`, `link_url`, `movie_id`, `is_active`, `sortOrder`).

---

## `GET /api/carousel/active`

Public homepage feed.

**Response `data`:** `{ items: [...] }` sorted by `order` asc.

---

## `GET /api/carousel`

Query params:

| Param | Values | Default |
|-------|--------|---------|
| `page` | number | `1` |
| `limit` | number | `20` (max 100) |
| `search` | string | — |
| `type` | `movie` \| `promotion` | — |
| `isActive` | `true` \| `false` \| `all` | `true` (public); admin uses `all` |
| `sort` | `order` \| `createdAt` \| `title` | `order` |
| `order` | `asc` \| `desc` | `asc` |

**Response `data`:**

```json
{
  "items": [ /* ApiCarouselItem */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

---

## `POST /api/carousel`

Admin create. JSON body (camelCase):

```json
{
  "type": "movie",
  "title": "Jurassic World: Rebirth",
  "description": "An all-new adventure…",
  "imageUrl": "https://cdn.example.com/hero.jpg",
  "linkUrl": "/movies/66ab...",
  "movieId": "66ab...",
  "isActive": true,
  "order": 1
}
```

---

## `PUT /api/carousel/:id`

Admin partial/full update. Same fields as create (all optional).

---

## `DELETE /api/carousel/:id`

Admin hard delete. Response `data` may be `null`.

---

## `PUT /api/carousel/reorder`

```json
{
  "orderedIds": ["id-first", "id-second", "id-third"]
}
```

Sets `order` to `index + 1` for each id. Returns `{ items }`.

---

## Frontend integration map

| UI | Service method | Endpoint |
|----|----------------|----------|
| Homepage hero | `carouselService.getActiveCarouselItems()` | `GET /api/carousel/active` |
| Admin list | `carouselService.getCarouselItems({ isActive: 'all' })` | `GET /api/carousel?isActive=all&sort=order` |
| Admin type tabs | same + `type` | `GET /api/carousel?isActive=all&type=movie` |
| Admin create | `carouselService.createCarouselItem()` | `POST /api/carousel` |
| Admin edit / toggle | `carouselService.updateCarouselItem()` | `PUT /api/carousel/:id` |
| Admin delete | `carouselService.deleteCarouselItem()` | `DELETE /api/carousel/:id` |
| Admin reorder | `carouselService.reorderCarouselItems()` | `PUT /api/carousel/reorder` |

Homepage CTAs:

- **View Details** → `/movies/:movieId`
- **Buy Tickets** → `/book/:movieId` when `movieId` is set; otherwise `linkUrl`
