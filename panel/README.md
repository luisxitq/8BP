# KZ License Panel

Admin panel for managing mod license keys. Deployable to Vercel with custom domain.

## Deploy to Vercel

1. Push this `panel/` folder as a **separate GitHub repository**
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. In Vercel dashboard → **Storage** → Create Postgres database → connect to project
4. Add Environment Variables (see below)
5. Deploy → Add domain `kztutorial.site`

## Environment Variables (set in Vercel dashboard)

| Key | Value |
|-----|-------|
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | your strong password |
| `JWT_SECRET` | random 32+ char string |
| `MOD_VERSION` | `1.0` |
| `ENCRYPT_KEY` | `JiM21rNU12eERlNmpqa3FuQks` |
| `WS_TOKEN` | `KJGMDKFJDHG34KD` |
| `POSTGRES_URL` | auto-filled by Vercel Postgres |

## First Run — Initialize Database

After deploying, call this once to create the database table:

```bash
curl -X POST https://kztutorial.site/api/setup
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/validate` | POST | Validate key from mod |
| `/api/licenses` | GET | List all keys |
| `/api/licenses` | POST | Create new key |
| `/api/licenses/:id` | DELETE | Delete key |
| `/api/licenses/:id` | PATCH | Update status |
| `/api/setup` | POST | Init database (run once) |

## Mod Integration

Update `keylogin.h` to use `https://lyn8bp.vercel.app/api/validate` with HTTP POST.
