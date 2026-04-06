import { z } from 'zod';

export const topicBriefSchema = z.object({
  clusterId: z.string(),
});

export const researchGenerateSchema = z.object({
  articleId: z.string(),
  angle: z.string().optional(),
});

export const outlineSchema = z.object({
  articleId: z.string(),
  angle: z.string().optional(),
  tone: z.enum(['ANALYTICAL', 'CRITICAL', 'EXPLANATORY']).default('ANALYTICAL'),
  sources: z.array(z.string()).optional(),
});

export const inlineAssistSchema = z.object({
  articleId: z.string(),
  paragraph: z.string(),
  tone: z.enum(['ANALYTICAL', 'CRITICAL', 'EXPLANATORY']).default('ANALYTICAL'),
});

export const counterpointSchema = z.object({
  articleId: z.string(),
  paragraph: z.string(),
});

export const headlineScoreSchema = z.object({
  headlines: z.array(z.string()).max(3),
});

export const simpleArticleIdSchema = z.object({
  articleId: z.string(),
});

export type TopicBriefInput = z.infer<typeof topicBriefSchema>;
export type ResearchGenerateInput = z.infer<typeof researchGenerateSchema>;
export type OutlineInput = z.infer<typeof outlineSchema>;
export type InlineAssistInput = z.infer<typeof inlineAssistSchema>;
export type CounterpointInput = z.infer<typeof counterpointSchema>;
export type HeadlineScoreInput = z.infer<typeof headlineScoreSchema>;
export type SimpleArticleIdInput = z.infer<typeof simpleArticleIdSchema>;
