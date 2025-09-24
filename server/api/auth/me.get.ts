import { requireAuth } from "~~/server/middleware/auth";

export default defineEventHandler(async event => {
  const context = requireAuth(event);

  return {
    user: context.user,
  };
});
