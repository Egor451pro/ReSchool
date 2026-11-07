import { z } from "zod";
import { donorInstitutionTypes } from "@/domain/access/roles";

const consentAccepted = z
  .union([z.literal("on"), z.literal("true"), z.literal("1"), z.boolean()])
  .refine((value) => value === true || value === "on" || value === "true" || value === "1", {
    message: "Нужно согласие на обработку персональных данных",
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Укажите почту")
    .pipe(z.email("Укажите почту")),
  password: z.string().min(1, "Введите пароль"),
});

export const registerDonorSchema = z.object({
  fullName: z.string().trim().min(2, "Укажите имя и фамилию").max(120),
  email: z.email("Укажите почту"),
  password: z
    .string()
    .min(8, "Пароль не короче 8 символов")
    .max(72, "Пароль не длиннее 72 символов"),
  institutionName: z.string().trim().min(3, "Укажите название учреждения").max(200),
  institutionType: z.enum(donorInstitutionTypes, { message: "Выберите тип учреждения" }),
  district: z.string().trim().min(2, "Укажите район").max(120),
  address: z.string().trim().min(5, "Укажите адрес").max(240),
  phone: z.string().trim().min(5, "Укажите телефон").max(40),
  institutionEmail: z.email("Укажите почту учреждения"),
  personalDataConsent: consentAccepted,
  acceptTerms: consentAccepted,
});

export const registerFreelancerSchema = z.object({
  fullName: z.string().trim().min(2, "Укажите имя и фамилию").max(120),
  email: z.email("Укажите почту"),
  password: z
    .string()
    .min(8, "Пароль не короче 8 символов")
    .max(72, "Пароль не длиннее 72 символов"),
  specialtyIds: z.array(z.string().min(1)).max(8).default([]),
  address: z.string().trim().max(240).optional(),
  personalDataConsent: consentAccepted,
  acceptTerms: consentAccepted,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterDonorInput = z.infer<typeof registerDonorSchema>;
export type RegisterFreelancerInput = z.infer<typeof registerFreelancerSchema>;
