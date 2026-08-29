# KZ License Panel — Info & Panduan Deploy

Panel web untuk manage license key mod 8 Ball Pool.  
Tech stack: **Next.js 14** + **Neon Postgres** + **Vercel**

---

## Struktur File

```
/
├── app/
│   ├── login/page.tsx          # Halaman login admin
│   ├── dashboard/page.tsx      # Dashboard utama (stats + tabel key)
│   └── api/
│       ├── auth/login/         # POST  — login admin
│       ├── auth/logout/        # POST  — logout
│       ├── licenses/           # GET list semua key | POST buat key baru
│       ├── licenses/[id]/      # DELETE hapus | PATCH ubah status
│       ├── validate/           # POST  — dipanggil oleh MOD saat login
│       └── setup/              # POST  — inisialisasi tabel database (1x)
├── lib/
│   ├── db.ts                   # Query database (Neon Postgres)
│   ├── auth.ts                 # JWT login session
│   └── keygen.ts               # Generator key + enkripsi XOR+Base64
├── middleware.ts               # Proteksi semua route (kecuali /login & /api/validate)
├── .env.example                # Template env vars
└── info.md                     # File ini
```

---

## Cara Deploy ke Vercel

### Step 1 — Import Repo
1. Buka [vercel.com](https://vercel.com)
2. **New Project** → Import repo `LYN8BP`
3. Framework: **Next.js** (auto-detect)
4. Jangan deploy dulu, lanjut ke Step 2

### Step 2 — Buat Database Neon
1. Di sidebar Vercel pilih **Storage**
2. Klik **Create** di baris **Neon** (Serverless Postgres)
3. Pilih region terdekat (Singapore/Asia)
4. Klik **Connect to Project** → pilih project `LYN8BP`
5. Vercel otomatis mengisi `DATABASE_URL` di Environment Variables

### Step 3 — Tambah Environment Variables
Masuk ke **Settings → Environment Variables** project, tambah:

| Key | Value |
|-----|-------|
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | password pilihan kamu |
| `JWT_SECRET` | random string min 32 karakter |
| `ENCRYPT_KEY` | `JiM21rNU12eERlNmpqa3FuQks` |
| `WS_TOKEN` | `KJGMDKFJDHG34KD` |
| `MOD_VERSION` | `1.0` |

> `DATABASE_URL` sudah otomatis ter-isi dari Step 2, tidak perlu isi manual.

### Step 4 — Deploy
1. Klik **Deploy**
2. Tunggu build selesai (~2 menit)

### Step 5 — Custom Domain
1. **Settings → Domains** → Add `kztutorial.site`
2. Vercel tampilkan DNS record yang harus diisi

### Step 6 — Setting DNS di Hostinger hPanel
Masuk ke **DNS Zone Editor** domain `kztutorial.site`, tambah 2 record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `76.76.21.21` | 3600 |
| CNAME | `www` | `cname.vercel-dns.com` | 3600 |

### Step 7 — Inisialisasi Database (WAJIB, 1x saja)
Setelah domain aktif, jalankan perintah ini SEKALI:
```
curl -X POST https://kztutorial.site/api/setup
```
Response sukses: `{"ok":true,"message":"Database initialized successfully"}`

---

## Penggunaan Panel

### Login Admin
- URL: `https://kztutorial.site/login`
- Username & password sesuai env vars `ADMIN_USERNAME` / `ADMIN_PASSWORD`

### Buat License Key
- Klik tombol **+ Create Key** di dashboard
- Isi: Game Type, Max Devices, Expiry Date (kosongkan = Lifetime), Note
- Key format: `KZ-XXXX-XXXX-XXXX-XXXX` (auto-generate) atau custom

### Manage Key
- **Activate** — aktifkan key yang banned/expired
- **Ban** — blokir key permanen
- **Delete** — hapus key dari database

---

## Integrasi Mod (keylogin.h)

Mod mengirim request ke:
```
POST https://kztutorial.site/api/validate
```

Format request (terenkripsi XOR+Base64):
```json
{
  "token": "KJGMDKFJDHG34KD",
  "data": "<base64(xor(payload, encrypt_key))>"
}
```

Payload terdekripsi:
```json
{
  "license_key": "KZ-XXXX-XXXX-XXXX-XXXX",
  "hwid": "<android_id>",
  "game_type": "8ball",
  "version": "1.0"
}
```

Response sukses (terenkripsi):
```json
{
  "data": "<base64(xor(response, encrypt_key))>"
}
```

---

## Environment Variables Lengkap

| Key | Keterangan |
|-----|------------|
| `DATABASE_URL` | Neon Postgres URL (auto dari Vercel Storage) |
| `ADMIN_USERNAME` | Username login panel |
| `ADMIN_PASSWORD` | Password login panel |
| `JWT_SECRET` | Secret untuk JWT session (min 32 char) |
| `ENCRYPT_KEY` | Kunci enkripsi XOR — HARUS sama dengan keylogin.h |
| `WS_TOKEN` | Token validasi request — HARUS sama dengan keylogin.h |
| `MOD_VERSION` | Versi mod yang diterima (default: `1.0`) |

---

## Nilai Default (harus cocok dengan mod)

```
ENCRYPT_KEY = JiM21rNU12eERlNmpqa3FuQks
WS_TOKEN    = KJGMDKFJDHG34KD
AUTH_TOKEN  = 0wQRlDkgoQlf   (dikembalikan server ke mod saat sukses)
```
