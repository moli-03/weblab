import { z } from "zod";
import { refreshTokenPair } from "~~/server/utils/auth";

const bodySchema = z.object({
  refreshToken: z.string(),
});

export default defineEventHandler(async event => {
  const { refreshToken } = await readValidatedBody(event, bodySchema.parse);

  try {
    return {
      tokens: refreshTokenPair(refreshToken),
    };
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Invalid refresh token",
    });
  }
});
