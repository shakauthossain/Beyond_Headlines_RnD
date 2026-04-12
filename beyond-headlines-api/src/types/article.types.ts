import { z } from 'zod';

export const articleCreateSchema = z.object({
  title: z.string().min(5),
  body: z.any(),
  excerpt: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  bannerImage: z.string().url().optional(),
  angle: z.string().optional(),
  tone: z.enum(['ANALYTICAL', 'CRITICAL', 'EXPLANATORY']).optional(),
});

export const articleUpdateSchema = articleCreateSchema.partial().extend({
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const articleQuerySchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  categoryId: z.string().optional(),
  authorId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});

export const categoryCreateSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  parentId: z.string().optional(),
});

export const tagCreateSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
});

export const revisionCreateSchema = z.object({
  body: z.any(),
  title: z.string(),
});

export type ArticleCreateInput = z.infer<typeof articleCreateSchema>;
export type ArticleUpdateInput = z.infer<typeof articleUpdateSchema>;
export type ArticleQueryInput = z.infer<typeof articleQuerySchema>;
