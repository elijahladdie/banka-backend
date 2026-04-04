import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: false,
  auth: env.smtpUser && env.smtpPass ? { user: env.smtpUser, pass: env.smtpPass } : undefined
});

export async function sendMail(to: string, subject: string, text: string) {
  if (!env.smtpHost || !env.smtpFrom) return;

  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    text
  });
}
