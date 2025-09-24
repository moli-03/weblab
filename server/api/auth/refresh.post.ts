import { z } from "zod";
import { getUserFromAccessToken, refreshTokenPair } from "~~/server/utils/auth";

const bodySchema = z.object({
  refreshToken: z.jwt(),
});

export default defineEventHandler(async event => {
  const { refreshToken } = await readValidatedBody(event, bodySchema.parse);

  try {
    const tokens = await refreshTokenPair(refreshToken);
    const user = await getUserFromAccessToken(tokens.accessToken);

    if (user == null) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "Invalid access token",
      });
    }

    return {
      tokens,
      user,
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
