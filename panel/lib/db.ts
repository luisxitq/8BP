import { neon } from '@neondatabase/serverless';

  function getSQL() {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('DATABASE_URL environment variable is not set');
    return neon(url);
  }

  export async function initDB() {
    const sql = getSQL();
    await sql`
      CREATE TABLE IF NOT EXISTS licenses (
        id         SERIAL PRIMARY KEY,
        key        VARCHAR(64) UNIQUE NOT NULL,
        status     VARCHAR(16) NOT NULL DEFAULT 'active',
        game_type  VARCHAR(32) NOT NULL DEFAULT '8ball',
        max_devices INT NOT NULL DEFAULT 1,
        note       TEXT DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        hwid       TEXT DEFAULT '',
        features   TEXT DEFAULT ''
      )
    `;
    // Migration: add features column to existing tables
    await sql`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS features TEXT DEFAULT ''`;
  }

  export interface License {
    id: number;
    key: string;
    status: 'active' | 'expired' | 'banned';
    game_type: string;
    max_devices: number;
    note: string;
    created_at: string;
    expires_at: string | null;
    hwid: string;
    features: string;
    active_devices?: number;
  }

  export async function getAllLicenses(): Promise<License[]> {
    const sql = getSQL();
    const rows = await sql`
      SELECT
        id, key, status, game_type, max_devices, note,
        created_at, expires_at, hwid, features,
        CASE WHEN hwid IS NOT NULL AND hwid != '' THEN 1 ELSE 0 END AS active_devices
      FROM licenses
      ORDER BY created_at DESC
    `;
    return rows as License[];
  }

  export async function getLicenseByKey(key: string): Promise<License | null> {
    const sql = getSQL();
    const rows = await sql`SELECT * FROM licenses WHERE key = ${key} LIMIT 1`;
    return (rows[0] as License) ?? null;
  }

  export async function createLicense(data: {
    key: string;
    game_type: string;
    max_devices: number;
    note: string;
    expires_at: string | null;
    features: string;
  }): Promise<License> {
    const sql = getSQL();
    const rows = await sql`
      INSERT INTO licenses (key, game_type, max_devices, note, expires_at, features)
      VALUES (${data.key}, ${data.game_type}, ${data.max_devices}, ${data.note}, ${data.expires_at}, ${data.features})
      RETURNING *
    `;
    return rows[0] as License;
  }

  export async function updateLicenseStatus(id: number, status: string): Promise<void> {
    const sql = getSQL();
    await sql`UPDATE licenses SET status = ${status} WHERE id = ${id}`;
  }

  export async function updateLicenseHwid(key: string, hwid: string): Promise<void> {
    const sql = getSQL();
    await sql`UPDATE licenses SET hwid = ${hwid} WHERE key = ${key}`;
  }

  export async function resetLicenseHwid(id: number): Promise<void> {
    const sql = getSQL();
    await sql`UPDATE licenses SET hwid = '' WHERE id = ${id}`;
  }

  export async function updateLicenseFeatures(id: number, features: string): Promise<void> {
    const sql = getSQL();
    await sql`UPDATE licenses SET features = ${features} WHERE id = ${id}`;
  }

  export async function deleteLicense(id: number): Promise<void> {
    const sql = getSQL();
    await sql`DELETE FROM licenses WHERE id = ${id}`;
  }

  export async function getStats() {
    const sql = getSQL();
    const rows = await sql`
      SELECT
        COUNT(*)                                                                       AS total,
        COUNT(*) FILTER (WHERE status = 'active')                                     AS active,
        COUNT(*) FILTER (WHERE status = 'expired'
          OR (expires_at IS NOT NULL AND expires_at < NOW()))                         AS expired,
        COUNT(*) FILTER (WHERE status = 'banned')                                     AS banned
      FROM licenses
    `;
    return rows[0];
  }

  export async function extendLicense(id: number, days: number): Promise<void> {
    const sql = getSQL();
    await sql`
      UPDATE licenses
      SET
        expires_at = (
          CASE
            WHEN expires_at IS NULL OR expires_at < NOW()
            THEN NOW() + (${days} || ' days')::INTERVAL
            ELSE expires_at + (${days} || ' days')::INTERVAL
          END
        ),
        status = CASE WHEN status = 'expired' THEN 'active' ELSE status END
      WHERE id = ${id}
    `;
  }
  