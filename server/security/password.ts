import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashed);
  } catch (error) {
    console.error("Password verification failed:", error);
    return false;
  }
}
