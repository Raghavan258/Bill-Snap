import * as Crypto from 'expo-crypto';
import { getDb } from './db';
import { setActiveUserId } from './scope';

export type LocalProfile = {
  id: string;
  fullName: string;
  mobile: string;
};

type UserRow = LocalProfile & {
  password_salt: string;
  password_hash: string;
};

/** Creates a local account and signs it in. The password is stored only as a salted hash. */
export async function registerLocalUser(input: {
  fullName: string;
  mobile: string;
  password: string;
}): Promise<LocalProfile> {
  const db = await getDb();
  const mobile = input.mobile.trim();
  const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM users WHERE mobile = ?', mobile);
  if (existing) throw new Error('mobile-taken');
  const id = Crypto.randomUUID();
  const { salt, passwordHash } = await createPasswordHash(input.password);
  const profile = { id, fullName: input.fullName.trim(), mobile };
  await db.runAsync(
    `INSERT INTO users (id, full_name, mobile, password_salt, password_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    profile.fullName,
    mobile,
    salt,
    passwordHash,
    new Date().toISOString(),
  );
  await storeSession(profile.id);
  return profile;
}

/** Checks the mobile number and password against the on-device hash. */
export async function loginLocalUser(mobile: string, password: string): Promise<LocalProfile> {
  const db = await getDb();
  const row = await db.getFirstAsync<UserRow>(
    `SELECT id, full_name AS fullName, mobile, password_salt, password_hash
     FROM users WHERE mobile = ?`,
    mobile.trim(),
  );
  if (!row) throw new Error('invalid-login');
  const matches = await verifyPassword(password, row.password_salt, row.password_hash);
  if (!matches) throw new Error('invalid-login');
  const profile = { id: row.id, fullName: row.fullName, mobile: row.mobile };
  await storeSession(profile.id);
  return profile;
}

/** Restores the last local sign-in. Returns null when nobody is signed in. */
export async function loadCurrentUser(): Promise<LocalProfile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<LocalProfile>(
    `SELECT u.id AS id, u.full_name AS fullName, u.mobile AS mobile
     FROM local_session s JOIN users u ON u.id = s.user_id WHERE s.id = 1`,
  );
  setActiveUserId(row?.id ?? null);
  return row ?? null;
}

/** Ends the local session. Saved records stay on the device for the next sign-in. */
export async function logoutLocalUser(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM local_session');
  setActiveUserId(null);
}

async function storeSession(userId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO local_session (id, user_id) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id`,
    userId,
  );
  setActiveUserId(userId);
}

async function createPasswordHash(password: string): Promise<{ salt: string; passwordHash: string }> {
  const salt = bytesToHex(await Crypto.getRandomBytesAsync(16));
  const passwordHash = await digestPassword(salt, password);
  return { salt, passwordHash };
}

async function verifyPassword(password: string, salt: string, passwordHash: string): Promise<boolean> {
  const digest = await digestPassword(salt, password);
  return digest === passwordHash;
}

async function digestPassword(salt: string, password: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((value) => value.toString(16).padStart(2, '0')).join('');
}
