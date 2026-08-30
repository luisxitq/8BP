# 8BP License Panel · Firebase RTDB (sin env vars)

Todo está **hardcodeado** en `lib/config.ts`.

| Campo | Valor |
|-------|--------|
| Usuario | `admin` |
| Contraseña | `admin` |
| RTDB | `https://aimengine-62132-default-rtdb.firebaseio.com` |

---

## 1. Reglas de Realtime Database (obligatorio)

Firebase Console → **Realtime Database** → **Rules**:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Publica las rules. El panel usa la API REST de Firebase (sin service account).

---

## 2. Deploy en Vercel

1. Sube la carpeta a GitHub
2. Vercel → New Project → Import
3. **No hace falta** Environment Variables
4. Deploy

Opcional:

```bash
curl -X POST https://TU-URL.vercel.app/api/setup
```

Login: **https://TU-URL.vercel.app/login**  
Usuario: `admin` · Contraseña: `admin`

---

## 3. Local

```bash
npm install
npm run dev
```

---

## 4. Cambiar usuario / password / Firebase

Edita solo `lib/config.ts`.
