# Knowledge Transfer: Cinema Booking Backend

Panduan step-by-step untuk junior developer agar mudah memahami repo `booking-be`, termasuk arsitektur, alur request, dan penjelasan CORS.

---

## 1. Repo ini apa?

Repo ini adalah **backend API sistem booking bioskop** (cinema booking).

- Frontend (React/Vite, dll.) memanggil API ini.
- Backend mengurus auth, film, jadwal, kursi, booking, dan pembayaran.
- Data disimpan di **MongoDB**.

Alur besar:

```
Browser (Frontend)
    │
    │  HTTP request (JSON)
    ▼
Express API (repo ini)
    │
    │  query / update
    ▼
MongoDB
    │
    │  hasil data
    ▼
Express API ──► JSON response ──► Browser (Frontend)
```

> Backend ini **bukan** website yang dilihat user. Yang dilihat user adalah frontend. Repo ini hanya menyediakan API.

---

## 2. Tech stack singkat

| Teknologi | Fungsi |
|---|---|
| Node.js + Express + TypeScript | Server API |
| MongoDB + Mongoose | Database |
| JWT + cookie HTTP-only | Authentication |
| express-validator | Validasi input |
| Helmet, CORS, rate limit | Keamanan |
| Midtrans | Pembayaran |
| Swagger | Dokumentasi API |
| Docker | Menjalankan app + MongoDB |

---

## 3. Langkah belajar yang tepat (urut)

Ikuti urutan ini. Jangan loncat ke Midtrans/booking atomic sebelum paham request flow dasar.

### Step 1 — Pahami peran FE, BE, DB

| Bagian | Contoh | Tugas |
|---|---|---|
| Frontend | `http://localhost:5173` | UI, form login, pilih kursi |
| Backend (repo ini) | `http://localhost:5000` | Business logic + API |
| Database | MongoDB | Simpan user, film, booking |

### Step 2 — Jalankan lokal

```bash
# 1. Install dependency
npm install

# 2. Siapkan environment
cp .env.example .env
# Edit .env sesuai kebutuhan (MONGO_URI, JWT_SECRET, dll.)

# 3. Jalankan development server
npm run dev
```

Cek:

- Health: [http://localhost:5000/health](http://localhost:5000/health)
- Swagger: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

Kalau `/health` sudah merespons, lanjut baca arsitektur.

### Step 3 — Baca file pintu masuk dulu

| Urutan | File | Kenapa penting |
|---|---|---|
| 1 | `src/server.ts` | Menyalakan server + connect database |
| 2 | `src/app.ts` | Pasang middleware (CORS, helmet, cookie, routes) |
| 3 | `src/routes/index.ts` | Daftar semua prefix API |
| 4 | Satu flow utuh (auth) | Route → controller → service → repository |

### Step 4 — Pahami arsitektur berlapis

Ini inti desain repo:

```
Request
  → Route           # URL + HTTP method
  → Validator       # Cek format input
  → Middleware      # Auth, rate limit, dll.
  → Controller      # Terima request, kirim response
  → Service         # Aturan bisnis
  → Repository      # Query database
  → Model / MongoDB
```

Analogi sederhana:

| Layer | Analogi | Contoh file |
|---|---|---|
| Route | Pintu & denah | `src/routes/auth.routes.ts` |
| Controller | Resepsionis | `src/controllers/auth.controller.ts` |
| Service | Otak bisnis | `src/services/auth.service.ts` |
| Repository | Bagian yang bicara ke DB | `src/repositories/user.repository.ts` |
| Model | Bentuk data | `src/models/User.ts` |

**Aturan penting untuk junior:**

- Jangan taruh query database di controller.
- Jangan urus `res.json` / HTTP response di repository.
- Logic bisnis (misalnya “kursi masih tersedia?”) milik service.

### Step 5 — Pelajari fitur satu per satu

Urutan disarankan:

1. **Auth** — register, login, logout, cookie JWT
2. **Movies / Showtimes / Halls / Cinemas / Cities** — data master
3. **Bookings** — inti produk (pilih kursi + race condition)
4. **Payments (Midtrans)** — charge & webhook
5. **Admin / Dashboard** — role `ADMIN`

### Step 6 — Baru pelajari keamanan

Setelah flow bisnis jelas, fokus ke:

- JWT + HTTP-only cookie
- Rate limiting
- Helmet
- Soft delete
- **CORS** (lihat bagian 5)

---

## 4. Peta folder

```
src/
├── config/         # env, database, cors, swagger, midtrans, google
├── routes/         # definisi endpoint
├── validators/     # aturan validasi input
├── middlewares/    # auth, rate limit, upload, error handler
├── controllers/    # HTTP layer (request/response)
├── services/       # business logic
├── repositories/   # akses MongoDB
├── models/         # Mongoose schema
├── helpers/        # format response, pagination
├── utils/          # helper teknis (JWT, logger, seat)
├── constants/      # konstanta bersama
├── types/          # TypeScript types & enums
├── seed/           # data awal / akun demo
├── app.ts          # setup Express
└── server.ts       # entry point
```

---

## 5. Apa itu CORS? Kenapa dipakai di repo ini?

### 5.1 Masalah yang diselesaikan

Browser punya aturan keamanan bernama **Same-Origin Policy**.

**Origin** = kombinasi `protocol + domain + port`.

Contoh beda origin:

| Aplikasi | Origin |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:5000` |

Karena beda port, browser menganggap keduanya **beda origin**. Tanpa izin CORS, browser akan **memblokir** frontend membaca response API, meski server sebenarnya sudah merespons.

Error di console browser biasanya mirip:

```text
Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

### 5.2 Cara kerja singkat

1. Frontend di `5173` memanggil API di `5000`.
2. Browser bertanya: “Apakah API mengizinkan origin `5173`?”
3. Backend mengirim header CORS, misalnya:
   - `Access-Control-Allow-Origin: http://localhost:5173`
   - `Access-Control-Allow-Credentials: true`
4. Jika cocok → browser izinkan frontend membaca response.
5. Jika tidak cocok → request gagal di sisi browser.

Kadang browser mengirim request **preflight** dulu (`OPTIONS`) untuk menanyakan:

- method apa yang boleh?
- header apa yang boleh?
- apakah credentials (cookie) boleh dikirim?

Di repo ini, CORS dipasang di `src/app.ts`:

```ts
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
```

Konfigurasi detail ada di `src/config/cors.ts`.

### 5.3 Kenapa repo ini wajib pakai CORS?

Karena arsitekturnya **frontend dan backend terpisah**:

- Frontend jalan di domain/port sendiri.
- Backend API jalan di domain/port lain.
- Authentication memakai **cookie** (`credentials: true`).

Tanpa CORS yang benar:

- Login dari frontend gagal di browser.
- Booking, payment, dan endpoint lain yang butuh cookie juga gagal.

### 5.4 Kenapa tidak boleh izinkan semua origin?

Jika backend mengizinkan semua origin sembarangan (terutama bersama cookie):

- Website lain bisa mencoba memanggil API dari browser user.
- Risiko penyalahgunaan session/cookie meningkat.

Makanya repo ini memakai **whitelist origin**, bukan “buka semua”.

### 5.5 Aturan CORS di repo ini

File utama: `src/config/cors.ts`

| Kondisi | Hasil |
|---|---|
| Tidak ada header `Origin` | Diizinkan (Postman, server-to-server, Swagger) |
| Origin ada di `CLIENT_URL` | Diizinkan |
| `localhost` / `127.0.0.1` | Diizinkan saat development / API lokal |
| Domain `*.brand-cinemas.online` | Diizinkan (frontend production) |
| Origin lain | Ditolak |

Pengaturan penting lainnya:

| Opsi | Artinya |
|---|---|
| `credentials: true` | Cookie JWT boleh dikirim cross-origin |
| `methods` | Method HTTP yang diizinkan |
| `allowedHeaders` | Header yang boleh dikirim FE (termasuk `Authorization`) |
| `exposedHeaders: ['Set-Cookie']` | Browser boleh melihat header cookie terkait |
| `maxAge: 86400` | Browser boleh cache hasil preflight 1 hari |

Environment terkait:

- `CLIENT_URL` — daftar origin frontend yang diizinkan (bisa dipisah koma)

### 5.6 Kenapa CORS juga dipasang di error handler?

Di `src/middlewares/error.middleware.ts`, saat terjadi error atau 404, header CORS tetap dipasang lewat `applyCorsHeaders`.

Alasan:

- Kalau error response tidak punya header CORS, frontend sering hanya melihat “CORS error”.
- Padahal penyebab aslinya bisa 401, 404, 500, atau error bisnis.
- Dengan CORS tetap ada di error response, debugging jadi lebih mudah.

---

## 6. Contoh alur request: Login

1. Client kirim `POST /api/auth/login` dengan email & password.
2. `auth.routes.ts` memasang rate limiter + validator.
3. `auth.controller.ts` memanggil `authService.login`.
4. `auth.service.ts` cek kredensial dan membuat JWT.
5. Controller set cookie HTTP-only, lalu kirim response sukses.
6. Request berikutnya (misalnya booking) membawa cookie tersebut.
7. Middleware `authenticate` membaca cookie/token dan mengisi `req.user`.

Format response umum:

**Sukses**

```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

**Error**

```json
{
  "success": false,
  "message": "",
  "errors": []
}
```

---

## 7. Booking flow (ringkas)

1. Client kirim `showtimeId` + `selectedSeats`.
2. Service memuat showtime.
3. Service cek ketersediaan kursi.
4. Update kursi secara atomic (aman terhadap race condition) + transaksi MongoDB.
5. Booking dibuat dengan status `PENDING`.
6. Client lanjut pembayaran:
   - sukses → status `CONFIRMED`
   - gagal → status `CANCELLED` + kursi dilepas

Jika kursi sudah diambil orang lain:

- HTTP status `409 Conflict`
- response berisi `unavailableSeats`

---

## 8. Endpoint utama (orientasi cepat)

| Area | Prefix | Catatan |
|---|---|---|
| Auth | `/api/auth` | register, login, logout, me |
| Movies | `/api/movies` | list/detail; create/update admin |
| Showtimes | `/api/showtimes` | jadwal + seat map |
| Bookings | `/api/bookings` | buat/lihat/batal booking |
| Payments | `/api/payments`, `/api/midtrans/...` | Midtrans + webhook |
| Admin | `/api/admin` | dashboard & data admin |
| Lainnya | `/api/halls`, `/api/cinemas`, `/api/cities`, `/api/concessions`, `/api/carousel`, `/api/media`, `/api/users` | master data & pendukung |

Dokumentasi lengkap tersedia di Swagger setelah server jalan.

---

## 9. Checklist “sudah paham” untuk junior

- [ ] Bisa jelaskan beda frontend, backend, dan database
- [ ] Bisa jalankan `npm run dev` dan buka Swagger
- [ ] Bisa trace 1 request dari route sampai MongoDB
- [ ] Tahu kenapa controller tidak boleh query DB langsung
- [ ] Tahu kenapa FE `5173` butuh CORS ke BE `5000`
- [ ] Tahu kenapa `credentials: true` + whitelist origin penting (karena cookie auth)
- [ ] Bisa login dan melihat cookie ter-set
- [ ] Bisa menjelaskan alur booking kursi secara singkat

---

## 10. Ringkasan satu kalimat

Repo ini adalah API booking bioskop berlapis (`route → controller → service → repository`). CORS dipakai supaya frontend di origin lain boleh memanggil API sambil mengirim cookie login, tanpa membuka akses ke semua website.

---

## 11. Referensi file penting

| Topik | File |
|---|---|
| Entry point | `src/server.ts` |
| Setup Express | `src/app.ts` |
| Konfigurasi CORS | `src/config/cors.ts` |
| Environment | `src/config/env.ts` |
| Daftar routes | `src/routes/index.ts` |
| Error + CORS header | `src/middlewares/error.middleware.ts` |
| Overview proyek | `README.md` |

---

## 12. Saran langkah berikutnya

Setelah membaca dokumen ini:

1. Trace fitur **login** end-to-end di kode.
2. Trace fitur **buat booking** end-to-end di kode.
3. Coba ubah `CLIENT_URL` di `.env` dan amati efek CORS dari frontend.
4. Baca rate limit di `src/middlewares/rateLimit.middleware.ts`.
5. Baca soft delete pattern di model/repository.

Jika ada bagian yang masih bingung, mulai dari satu endpoint di Swagger, lalu ikuti pemanggilan fungsi di kode dari route sampai repository.
