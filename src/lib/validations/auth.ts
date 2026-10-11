import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email");
const password = z.string().min(10, "Use at least 10 characters").max(72);

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  email,
  password,
});

export const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password") });
export const emailSchema = z.object({ email });
export const resetSchema = z.object({ password });
