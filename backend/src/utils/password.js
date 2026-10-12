import bcrypt from "bcryptjs";
import crypto from "crypto";

const BCRYPT = /^\$2[aby]\$\d{2}\$/; // $2y$ is what PHP's password_hash() writes
const MD5 = /^[a-f0-9]{32}$/i; // legacy PHP md5($password)

export function hashPassword(plain) {
  return bcrypt.hash(String(plain), 10);
}

// Supports bcrypt hashes (including PHP $2y$), legacy md5 hashes and legacy plain-text passwords.
export async function matchesPassword(input, stored) {
  if (!stored || input === undefined || input === null) return false;
  const password = String(input);
  if (BCRYPT.test(stored)) return bcrypt.compare(password, stored);
  if (MD5.test(stored) && crypto.createHash("md5").update(password).digest("hex") === stored.toLowerCase()) return true;
  return password === stored;
}
