import dotenv from "dotenv";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().nonempty(),
  JWT_ACCESS_SECRET: z.string().nonempty(),
  JWT_REFRESH_SECRET: z.string().nonempty(),
});

dotenv.config({ path: ".env" });

export type EnvSchema = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);
