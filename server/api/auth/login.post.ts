import { z } from "zod";
import { db } from "~~/server/database";
import type { User } from "~~/server/database/schema";
import { comparePasswords } from "~~/server/security/password";

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

type ReducedUser = Omit<User, "passwordHash">;

export default defineEventHandler(async event => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse);

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      message: "Bad credentials",
    });
  }

  const passwordMatches = await comparePasswords(password, user.passwordHash);

  if (!passwordMatches) {
    throw createError({
      statusCode: 401,
      message: "Bad credentials",
    });
  }

  const reducedUser: ReducedUser = Object.assign(user, { passwordHash: undefined });

  return {
    user: reducedUser,
  };
});
