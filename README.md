# 8BP License Panel · Firebase Realtime Database

Panel admin para keys del mod 8 Ball Pool.  
Stack: **Next.js 14** + **Firebase Admin (RTDB)** + **Vercel**

Proyecto Firebase: `aimengine-62132`  
Database: `https://aimengine-62132-default-rtdb.firebaseio.com`

---

## 1. Service Account (obligatorio)

El config de cliente (`apiKey`, `authDomain`…) **no sirve en el servidor**.  
Necesitas una **Service Account**:

1. [Firebase Console](https://console.firebase.google.com) → proyecto **aimengine-62132**
2. ⚙️ **Project settings** → pestaña **Service accounts**
3. **Generate new private key** → descarga el JSON
4. Del JSON copia:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (con los `\n` incluidos)

---

## 2. Reglas de Realtime Database

En Firebase → **Realtime Database** → **Rules**:

```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```

Solo el Admin SDK (servidor) puede leer/escribir. El cliente del navegador **no** debe tener acceso.

Índice para búsquedas por `key` (si usas query):

Firebase Console → RTDB → Rules → Indexes (si te lo pide al hacer `orderByChild('key')`).

---

## 3. Variables de entorno (Vercel)

| Key | Valor |
|-----|--------|
| `FIREBASE_PROJECT_ID` | `aimengine-62132` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-…@aimengine-62132.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n"` |
| `FIREBASE_DATABASE_URL` | `https://aimengine-62132-default-rtdb.firebaseio.com` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | password fuerte |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `MOD_VERSION` | `1.0` |
| `ENCRYPT_KEY` | `JiM21rNU12eERlNmpqa3FuQks` |
| `WS_TOKEN` | `KJGMDKFJDHG34KD` |

> En Vercel, el `FIREBASE_PRIVATE_KEY` debe ir entre comillas y con `\n` literales.

---

## 4. Deploy en Vercel

1. Sube esta carpeta a un repo de GitHub
2. Vercel → **New Project** → Import
3. Framework: Next.js (auto)
4. Añade las Environment Variables
5. Deploy

### Primera vez — init

```bash
curl -X POST https://TU-DOMINIO.vercel.app/api/setup
```

---

## 5. API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/validate` | POST | Validación desde el mod (público) |
| `/api/licenses` | GET | Listar keys (admin) |
| `/api/licenses` | POST | Crear key (admin) |
| `/api/licenses/:id` | PATCH | Status / extend / reset HWID / features |
| `/api/licenses/:id` | DELETE | Borrar key |
| `/api/setup` | POST | Init meta en RTDB |
| `/api/auth/login` | POST | Login admin |
| `/api/auth/logout` | POST | Logout |

### Validación del mod

```
POST /api/validate
{
  "token": "KJGMDKFJDHG34KD",
  "data": "<base64(xor(payload, ENCRYPT_KEY))>"
}
```

Payload descifrado:

```json
{
  "license_key": "LYN8BP-XXXX-XXXX",
  "hwid": "<android_id>",
  "game_type": "8ball",
  "version": "1.0"
}
```

---

## 6. Estructura en RTDB

```
licenses/
  LYN8BP-XXXX-XXXX/
    key: "LYN8BP-XXXX-XXXX"
    status: "active"
    game_type: "8ball"
    max_devices: 1
    note: ""
    created_at: "2026-..."
    expires_at: null
    hwid: ""
    features: ""
_meta/
  init: { initialized: true, at: "..." }
```

---

## 7. Local

```bash
cp .env.example .env.local
# rellena las vars
npm install
npm run dev
```

Abre http://localhost:3000/login

---

## Seguridad

- **Nunca** dejes reglas RTDB en modo abierto (`".write": true`).
- Cambia `ADMIN_PASSWORD`, `JWT_SECRET`, y idealmente `ENCRYPT_KEY` / `WS_TOKEN` si el mod lo permite.
- El `apiKey` de cliente que compartiste es público por diseño; la seguridad real está en las **Rules** + **Service Account** solo en el servidor.
