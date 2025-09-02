import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "~~/server/database";
import { users } from "~~/server/database/schema";
import { hashPassword } from "~~/server/security/password";

const bodySchema = z.object({
  email: z.email().refine(
    async email => {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      return !existingUser;
    },
    {
      error: "Email already in use",
    },
  ),
  password: z.string().min(8),
  name: z.string().min(2).max(255),
});

export default defineEventHandler(async event => {
  const { email, password, name } = await readValidatedBody(event, bodySchema.parseAsync);

  try {
    const user = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash: await hashPassword(password),
      })
      .returning();

    return {
      user,
    };
  } catch (error) {
    console.error("Error registering user:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "Failed to register user",
    });
  }
});
