import { z } from 'zod';

export const LeadFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  budget: z.string().optional(),
  location: z.string().optional(),
  propertyType: z.string().optional(),
  intent: z.enum(['rent', 'purchase']).optional(),
  timeline: z.enum(['immediate', '1month', '3months', '6months', '1year']).optional(),
});

export const ChatMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
  chatId: z.string().optional(),
});

export const KnowledgeBaseUploadSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().optional(),
  fileType: z.enum(['pdf', 'docx', 'text']).optional(),
});

export const AdminLoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LucknowAreaSchema = z.object({
  areaName: z.string().min(2, 'Area name required'),
  description: z.string().optional(),
  facilities: z.record(z.array(z.string())).optional(),
  priceRange: z.string().optional(),
  propertyTypes: z.array(z.string()).optional(),
});

export type LeadFormType = z.infer<typeof LeadFormSchema>;
export type ChatMessageType = z.infer<typeof ChatMessageSchema>;
export type AdminLoginType = z.infer<typeof AdminLoginSchema>;
export type LucknowAreaType = z.infer<typeof LucknowAreaSchema>;
