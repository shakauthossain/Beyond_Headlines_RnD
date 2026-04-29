import { z } from 'zod';

// Step 2 & 3: Research
export const topicBriefSchema = z.object({
  email: z.string().email(),
  clusterId: z.string(),
});

export const topicBriefResponseSchema = z.object({
  issue_summary: z.string(),
  key_questions: z.array(z.string()),
  stakeholders: z.array(z.object({
    name: z.string(),
    role: z.string()
  })),
  viewpoints: z.array(z.string()),
  suggested_angles: z.array(z.object({
    title: z.string(),
    reasoning: z.string(),
    target_audience: z.string()
  })),
  generatedAt: z.string()
});

export const researchGenerateSchema = z.object({
  email: z.string().email(),
  articleId: z.string(),
  angle: z.string().optional(),
});

export const researchResponseSchema = z.object({
  timeline: z.array(z.object({
    date: z.string(),
    event: z.string(),
    impact: z.string()
  })),
  data_points: z.array(z.object({
    value: z.string(),
    metric: z.string(),
    context: z.string()
  })),
  gaps: z.array(z.object({
    topic: z.string(),
    details: z.string()
  })),
  sources: z.array(z.object({
    title: z.string(),
    summary: z.string(),
    url: z.string(),
    credibility: z.enum(['High', 'Medium', 'Developing'])
  })).optional(),
  generatedAt: z.string()
});

// Step 4: Drafting
export const outlineSchema = z.object({
  email: z.string().email(),
  articleId: z.string(),
  angle: z.string().optional(),
  tone: z.enum(['ANALYTICAL', 'CRITICAL', 'EXPLANATORY']).default('ANALYTICAL'),
  sources: z.array(z.string()).optional(),
});

export const inlineAssistSchema = z.object({
  email: z.string().email(),
  articleId: z.string(),
  paragraph: z.string(),
  tone: z.enum(['ANALYTICAL', 'CRITICAL', 'EXPLANATORY']).default('ANALYTICAL'),
});

export const inlineAssistResponseSchema = z.object({
  original: z.string(),
  suggested: z.string(),
  rationale: z.string(),
  generatedAt: z.string()
});

export const counterpointSchema = z.object({
  email: z.string().email(),
  articleId: z.string(),
  paragraph: z.string(),
});

// Step 5: Sub-editing
export const subEditSchema = z.object({
  articleId: z.string(),
});

export const subEditResponseSchema = z.object({
  clarity_issues: z.array(z.object({
    paragraph_index: z.number(),
    issue_description: z.string(),
    suggested_fix: z.string()
  })),
  tone_issues: z.array(z.object({
    paragraph_index: z.number(),
    issue_description: z.string(),
    suggested_fix: z.string()
  })),
  flow_issues: z.array(z.object({
    paragraph_index: z.number(),
    issue_description: z.string(),
    suggested_fix: z.string()
  })),
  generatedAt: z.string()
});

export const headlineScoreSchema = z.object({
  headlines: z.array(z.string()).max(3),
});

export const seoMetadataResponseSchema = z.object({
  meta_title: z.string(),
  meta_description: z.string(),
  tags: z.array(z.string()),
  generatedAt: z.string()
});

// Step 6: Packaging
export const packagingResponseSchema = z.object({
  image_concept: z.string(),
  pull_quotes: z.array(z.object({
    quote: z.string(),
    paragraph_index: z.number()
  })),
  social_captions: z.object({
    twitter: z.string(),
    linkedin: z.string(),
    whatsapp: z.string()
  }),
  generatedAt: z.string()
});

export const simpleArticleIdSchema = z.object({
  email: z.string().email(),
  articleId: z.string(),
});

export type TopicBriefInput = z.infer<typeof topicBriefSchema>;
export type ResearchGenerateInput = z.infer<typeof researchGenerateSchema>;
export type OutlineInput = z.infer<typeof outlineSchema>;
export type InlineAssistInput = z.infer<typeof inlineAssistSchema>;
export type CounterpointInput = z.infer<typeof counterpointSchema>;
export type HeadlineScoreInput = z.infer<typeof headlineScoreSchema>;
export type SimpleArticleIdInput = z.infer<typeof simpleArticleIdSchema>;

export type TopicBriefResponse = z.infer<typeof topicBriefResponseSchema>;
export type ResearchResponse = z.infer<typeof researchResponseSchema>;
export type OutlineResponse = {
  sections: Array<{ label: string; direction: string }>;
  generatedAt: string;
};
export type InlineAssistResponse = z.infer<typeof inlineAssistResponseSchema>;
export type SubEditResponse = z.infer<typeof subEditResponseSchema>;
export type SEOMetadataResponse = z.infer<typeof seoMetadataResponseSchema>;
export type PackagingResponse = z.infer<typeof packagingResponseSchema>;
