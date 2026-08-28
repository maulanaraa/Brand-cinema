# Cinema Booking System Backend

Production-ready cinema booking API built with Node.js, Express, MongoDB, and TypeScript following Clean Architecture and SOLID principles.

## Features

- JWT authentication via HTTP-only cookies
- Role-based authorization (ADMIN / USER)
- Atomic seat booking with MongoDB transactions (race-condition safe)
- Soft delete on all entities
- Search, pagination, and sorting
- Movie poster upload with Multer
- Payment simulation endpoint
- Admin dashboard statistics
- Swagger API documentation
- Docker-ready
- Rate limiting, Helmet, CORS, Compression

## Tech Stack

- Node.js + Express.js + TypeScript
- MongoDB + Mongoose
- JWT + bcryptjs + cookie-parser
- express-validator
- multer, dayjs, uuid
- swagger-jsdoc + swagger-ui-express
- helmet, cors, compression, express-rate-limit, morgan

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values
```

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/cinema-booking` |
| `JWT_SECRET` | JWT signing secret | `your-secret` |
| `JWT_EXPIRE` | JWT expiry | `7d` |
| `COOKIE_SECRET` | Cookie signing secret | `your-cookie-secret` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:3000` |

## Run Project

```bash
# Development (nodemon + ts-node)
npm run dev

# Build
npm run build

# Production
npm start

# Seed sample data
npm run seed
```

### Docker

```bash
docker-compose up --build
```

## Seed Accounts

After running `npm run seed`:

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@cinema.com` | `Admin@123` |
| USER | `user@cinema.com` | `User@1234` |

## Folder Structure

```
backend/
├── src/
│   ├── config/          # Database, env, swagger
│   ├── controllers/     # HTTP layer only
│   ├── middlewares/     # Auth, validation, upload, errors
│   ├── models/          # Mongoose schemas
│   ├── repositories/    # Database access layer
│   ├── services/        # Business logic
│   ├── validators/      # express-validator rules
│   ├── routes/          # Route definitions
│   ├── utils/           # Auth, seats, logger
│   ├── constants/       # Shared constants
│   ├── helpers/         # Response helpers, pagination
│   ├── types/           # TypeScript types & enums
│   ├── seed/            # Seed script
│   ├── app.ts           # Express app setup
│   └── server.ts        # Entry point
├── uploads/posters/     # Uploaded posters
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## Architecture

```
Request → Route → Validator → Middleware → Controller → Service → Repository → MongoDB
```

- **Controller**: handles HTTP request/response only
- **Service**: business logic
- **Repository**: database operations
- Each module is isolated

## API List

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | - | Register user |
| POST | `/api/auth/login` | - | Login |
| POST | `/api/auth/logout` | - | Logout |
| GET | `/api/auth/me` | User | Current user |

### Movies

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/movies` | - | List (search, genre, pagination) |
| GET | `/api/movies/:id` | - | Get movie |
| POST | `/api/movies` | Admin | Create movie (multipart) |
| PUT | `/api/movies/:id` | Admin | Update movie |
| DELETE | `/api/movies/:id` | Admin | Soft delete |

### Showtimes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/showtimes` | - | List showtimes |
| GET | `/api/showtimes/:id` | - | Get showtime |
| GET | `/api/showtimes/:id/seats` | - | Seat availability |
| POST | `/api/showtimes` | Admin | Create showtime |
| PUT | `/api/showtimes/:id` | Admin | Update showtime |
| DELETE | `/api/showtimes/:id` | Admin | Soft delete |

### Bookings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/bookings` | User | Create booking |
| GET | `/api/bookings/me` | User | My bookings |
| GET | `/api/bookings/:id` | User | Get booking |
| DELETE | `/api/bookings/:id` | User | Cancel booking |
| PATCH | `/api/bookings/:id/payment` | User | Simulate payment |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/bookings` | Admin | All bookings |
| GET | `/api/admin/dashboard` | Admin | Dashboard stats |

## Booking Flow

1. Client sends `showtimeId` + `selectedSeats`
2. Backend loads showtime
3. Verifies seat availability
4. Atomic `$addToSet` update + MongoDB transaction
5. Creates booking with status `PENDING`
6. Client calls payment simulation:
   - `SUCCESS` → `CONFIRMED`
   - `FAILED` → `CANCELLED` + seats released

If seats are already booked:

```json
{
  "success": false,
  "message": "Seat unavailable",
  "unavailableSeats": ["A1", "B5"]
}
```

Status: `409 Conflict`

## Response Format

Success:

```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "",
  "errors": []
}
```

## Rate Limits

| Endpoint | Limit | Window |
|---|---|---|
| Login | 5 | 15 minutes |
| Register | 3 | 15 minutes |
| Booking | 10 | 1 minute |

## Swagger Docs

After starting the server:

```
http://localhost:5000/api-docs
```

## Health Check

```
GET /health
```

## License

MIT
