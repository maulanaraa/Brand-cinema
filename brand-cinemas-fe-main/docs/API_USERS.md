# Users API (Admin)

Status: **Frontend ready** — backend should implement these endpoints for `/admin/users`.

Purpose: admin CRUD for customer (`USER`) and administrator (`ADMIN`) accounts. Registration via `/api/auth/register` stays public and always creates `USER`; this API is for staff-managed accounts.

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

All endpoints require an **admin session cookie** (`credentials: 'include'`), same as other `/api/*` admin mutations.

| Action | Auth |
|--------|------|
| List / get / create / update / delete | Admin only (`role === ADMIN`) |

Public auth routes (`/api/auth/register`, login, Google, forgot/reset) are unchanged and must **not** accept a client-supplied `role`.

---

## Endpoint summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users` | Admin | Paginated list + filters |
| GET | `/api/users/:id` | Admin | Single user |
| POST | `/api/users` | Admin | Create user (any role) |
| PUT | `/api/users/:id` | Admin | Update user |
| DELETE | `/api/users/:id` | Admin | Soft-delete (`isDeleted: true`) |

Suggested mount in `routes/index.ts`:

```ts
router.use('/users', userRoutes);
```

---

## Data model (response)

Never return `password`, `googleId`, `passwordResetToken`, `passwordResetExpires`, or `tokenVersion` in list/detail payloads.

| Field | Type | Notes |
|-------|------|-------|
| `_id` | string | Mongo id (FE also accepts `id`) |
| `name` | string | Required, max 100 |
| `email` | string | Required, unique, lowercase |
| `role` | `"USER"` \| `"ADMIN"` | |
| `createdAt` / `updatedAt` | ISO string | |

Optional extras (nice-to-have):

| Field | Type | Notes |
|-------|------|-------|
| `authProvider` | `"local"` \| `"google"` | Derived from whether `googleId` is set |
| `hasPassword` | boolean | Useful for Google-only accounts |

Aligns with existing `User` model in `booking-be` (`name`, `email`, `password`, `googleId`, `role`, `isDeleted`, timestamps). Repository already has `findAll`, `update`, `softDelete`, `count`.

---

## `GET /api/users`

Query params:

| Param | Values | Default |
|-------|--------|---------|
| `page` | number ≥ 1 | `1` |
| `limit` | 1–100 | `10` |
| `search` | string | — | Match `name` or `email` (case-insensitive) |
| `role` | `USER` \| `ADMIN` | — | Omit = all roles |
| `sort` | `name` \| `email` \| `role` \| `createdAt` | `createdAt` |
| `order` | `asc` \| `desc` | `desc` |

Rules:

- Exclude soft-deleted users (`isDeleted: false`)
- Do not select password / secrets

**Response `data`:**

```json
{
  "items": [
    {
      "_id": "66f0...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "USER",
      "createdAt": "2026-07-01T10:00:00.000Z",
      "updatedAt": "2026-07-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

Alias `users` instead of `items` is accepted by the frontend.

---

## `GET /api/users/:id`

Admin single fetch. 404 if missing or soft-deleted.

**Response `data`:** one user object (or `{ user }` / `{ item }`).

---

## `POST /api/users`

Create account (admin may set role).

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "role": "USER"
}
```

Validation:

- `name` required, 1–100 chars
- `email` required, valid email, unique among non-deleted users
- `password` required, min 8 chars (hash with same bcrypt cost as auth register)
- `role` required, `USER` or `ADMIN`

Errors:

- `400` validation
- `409` email already in use (or `400` with clear message — FE shows `message` / `errors`)

**Response `data`:** created user (no password). HTTP `201`.

---

## `PUT /api/users/:id`

Partial/full update.

```json
{
  "name": "Jane Admin",
  "email": "jane.admin@example.com",
  "role": "ADMIN",
  "password": "optionalNewPassword"
}
```

Rules:

- All fields optional
- If `password` omitted or empty → keep existing password
- If `password` provided → min 8 chars, re-hash
- Email uniqueness if changed
- Prefer **not** allowing an admin to demote/delete themselves into a lockout:
  - Reject changing **own** `role` from `ADMIN` → `USER` if that would leave zero admins, **or** simply forbid self role-demotion
  - Soft-delete of self must return `400` / `403` (`You cannot delete your own account`)

Google-only users (no password): allowing optional password set is fine; do not require clearing `googleId`.

**Response `data`:** updated user.

---

## `DELETE /api/users/:id`

Soft-delete: set `isDeleted: true` (and ideally bump `tokenVersion` so active sessions die).

Rules:

- Cannot delete own account
- Prefer blocking delete of the **last remaining ADMIN**
- Return `404` if already deleted / missing

**Response `data`:** `null`.

---

## Backend checklist

- [ ] `GET/POST /api/users`, `GET/PUT/DELETE /api/users/:id` with `authenticate` + `authorizeAdmin`
- [ ] Validators (query + body) in `validators/index.ts`
- [ ] Service layer: hash password, uniqueness, self-delete / last-admin guards
- [ ] Wire existing `userRepository.findAll` / `update` / `softDelete` / `count`
- [ ] Response never leaks secrets
- [ ] CORS / cookie same as other admin routes; Vite proxies `/api` → `localhost:5000` in DEV

---

## Frontend integration map

| UI | Service method | Endpoint |
|----|----------------|----------|
| Admin Users list | `userService.getUsers()` | `GET /api/users?...` |
| Add user | `userService.createUser()` | `POST /api/users` |
| Edit user | `userService.updateUser()` | `PUT /api/users/:id` |
| Delete user | `userService.deleteUser()` | `DELETE /api/users/:id` |

Admin UI path: `/admin/users` (sidebar **Users**).
