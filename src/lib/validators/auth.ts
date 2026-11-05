import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Укажите почту"),
  password: z.string().min(1, "Введите пароль"),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Укажите имя и фамилию").max(120),
  email: z.email("Укажите почту"),
  password: z
    .string()
    .min(8, "Пароль не короче 8 символов")
    .max(72, "Пароль не длиннее 72 символов"),
  institutionId: z.string().min(1, "Выберите учреждение"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
