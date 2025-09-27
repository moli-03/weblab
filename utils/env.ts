import dotenv from "dotenv";
import { z } from "zod";

const envSchema = z.object({
  DB_USERNAME: z.string().nonempty(),
  DB_PASSWORD: z.string().nonempty(),
  DB_HOST: z.string().nonempty(),
  DB_PORT: z.coerce.number().min(1).max(65535),
  DB_NAME: z.string().nonempty(),

  JWT_ACCESS_SECRET: z.string().nonempty(),
  JWT_REFRESH_SECRET: z.string().nonempty(),
});

dotenv.config({ path: ".env" });

export type EnvSchema = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);
