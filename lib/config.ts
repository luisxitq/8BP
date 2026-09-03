/** Todo hardcodeado — sin variables de entorno */

export const ADMIN_USERNAME = 'admin';
export const ADMIN_PASSWORD = 'admin';

export const JWT_SECRET = '8bp_aimengine_jwt_secret_key_32chars!!';

export const MOD_VERSION = '1.1';
export const ENCRYPT_KEY = 'JiM21rNU12eERlNmpqa3FuQks';
export const WS_TOKEN = 'KJGMDKFJDHG34KD';

/** Firebase Realtime Database (proyecto aimengine-62132) */
export const RTDB_URL = 'https://aimengine-62132-default-rtdb.firebaseio.com';

/** Config cliente (referencia; el panel usa REST en el servidor) */
export const FIREBASE_CLIENT = {
  apiKey: 'AIzaSyDnHlg9pSGph59UzAaIAfUt3AuoLGe4CUk',
  authDomain: 'aimengine-62132.firebaseapp.com',
  databaseURL: RTDB_URL,
  projectId: 'aimengine-62132',
  storageBucket: 'aimengine-62132.firebasestorage.app',
  messagingSenderId: '828004881979',
  appId: '1:828004881979:web:9601af6339bcc11e636e1e',
  measurementId: 'G-R0YKPZ0NG6',
} as const;
