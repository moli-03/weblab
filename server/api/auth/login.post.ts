import { z } from "zod";
import { db } from "~~/server/database";
import { verifyPassword } from "~~/server/security/password";
import { generateTokenPair, auditLogin } from "~~/server/utils/auth";
import { toPublicUser } from "~~/server/utils/response-sanitizer";

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

export default defineEventHandler(async event => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse);

  const clientIP = getRequestIP(event) || getHeader(event, "x-forwarded-for") || "unknown";
  const userAgent = getHeader(event, "user-agent") || "unknown";

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });

  if (!user) {
    await auditLogin(null, clientIP, userAgent, false, "User not found");

    throw createError({
      statusCode: 401,
      message: "Bad credentials",
    });
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    await auditLogin(user.id, clientIP, userAgent, false, "Invalid password");

    throw createError({
      statusCode: 401,
      message: "Bad credentials",
    });
  }

  await auditLogin(user.id, clientIP, userAgent, true);

  const tokens = await generateTokenPair(user);

  return {
    tokens,
    user: toPublicUser(user),
  };
});
