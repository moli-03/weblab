import bcrypt from "bcrypt";

// Use a higher salt rounds for better security (12 is more secure than 10)
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  // Validate password strength
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  if (!password || !hashed) {
    return false;
  }

  try {
    return await bcrypt.compare(password, hashed);
  } catch (error) {
    console.error("Password verification failed:", error);
    return false;
  }
}
