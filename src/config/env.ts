import dotenv from "dotenv";
import { cleanEnv, str, num, bool, url } from "envalid";

dotenv.config();

// Step 1: validate raw env
const validatedEnv = cleanEnv(process.env, {
  PORT: num({ default: 5000 }),
  NODE_ENV: str({ default: "development" }),

  DATABASE_URL: str(),

  JWT_SECRET: str(),
  JWT_EXPIRES_IN: str({ default: "1d" }),

  COOKIE_NAME: str({ default: "banka_token" }),
  COOKIE_SECURE: bool({ default: false }),

  FRONTEND_URL: url({ default: "http://localhost:3000" }),

  DATABASE_SSL: bool({ default: true }),

  
  SMTP_PORT: num({ default: 587 }),
  SMTP_HOST: str(),
  REDIS_URL: str(),
  SMTP_USER: str(),
  SMTP_PASS: str(),
  SMTP_FROM: str(),
});

// Step 2: export in your preferred structure
export const env = {
  port: validatedEnv.PORT,
  nodeEnv: validatedEnv.NODE_ENV,
  databaseUrl: validatedEnv.DATABASE_URL,

  jwtSecret: validatedEnv.JWT_SECRET,
  jwtExpiresIn: validatedEnv.JWT_EXPIRES_IN,

  cookieName: validatedEnv.COOKIE_NAME,
  cookieSecure: validatedEnv.COOKIE_SECURE,

  frontendUrl: validatedEnv.FRONTEND_URL,

  databaseSsl: validatedEnv.DATABASE_SSL,

  redisUrl: validatedEnv.REDIS_URL,

  smtpHost: validatedEnv.SMTP_HOST,
  smtpPort: validatedEnv.SMTP_PORT,
  smtpUser: validatedEnv.SMTP_USER,
  smtpPass: validatedEnv.SMTP_PASS,
  smtpFrom: validatedEnv.SMTP_FROM,
};