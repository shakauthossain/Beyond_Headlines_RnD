import { Router } from 'express';
import { articles } from '../data/mockData';
import { 
  outlineSchema, 
  inlineAssistSchema, 
  counterpointSchema, 
  headlineScoreSchema, 
  simpleArticleIdSchema 
} from '../types/ai.types';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { ok, notFound } from '../utils/response';
import { LATENCY } from '../utils/delay';

const router = Router();

/**
 * @swagger
 * /ai/outline:
 *   post:
 *     summary: Generate an article outline
 *     tags: [AI — Step 4: Drafting]
 */
router.post('/outline', authenticate, validate(outlineSchema), async (req, res) => {
  await LATENCY.sonnet();
  const article = articles.find(a => a.id === req.body.articleId);
  if (!article) return notFound(res, 'Article not found');

  return ok(res, {
    articleId: article.id,
    outline: [
      { section: 'Introduction', points: ['Hook', 'Context'] },
      { section: 'Main Body', points: ['Point A', 'Point B'] },
      { section: 'Conclusion', points: ['Summary', 'Future Outlook'] }
    ],
    generatedAt: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /ai/inline-assist:
 *   post:
 *     summary: Help with a paragraph context
 *     tags: [AI — Step 4: Drafting]
 */
router.post('/inline-assist', authenticate, validate(inlineAssistSchema), async (req, res) => {
  await LATENCY.sonnet();
  return ok(res, {
    suggestion: `In an ${req.body.tone} tone, perhaps consider: "${req.body.paragraph.substring(0, 50)}... and why it matters."`,
    generatedAt: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /ai/counterpoint:
 *   post:
 *     summary: Generate a counter-argument
 *     tags: [AI — Step 4: Drafting]
 */
router.post('/counterpoint', authenticate, validate(counterpointSchema), async (req, res) => {
  await LATENCY.sonnet();
  return ok(res, {
    counterpoint: `While the argument states "${req.body.paragraph.substring(0, 30)}...", some experts argue that long-term stability is more complex.`,
    generatedAt: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /ai/sub-edit:
 *   post:
 *     summary: Perform a sub-edit check
 *     tags: [AI — Step 5: Sub-editing]
 */
router.post('/sub-edit', authenticate, validate(simpleArticleIdSchema), async (req, res) => {
  await LATENCY.sonnet();
  return ok(res, {
    issues: [
      { type: 'grammar', description: 'Subject-verb agreement error in 2nd paragraph.' },
      { type: 'clarity', description: 'Avoid complex jargon in the intro.' }
    ],
    score: 85,
    generatedAt: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /ai/seo-metadata:
 *   post:
 *     summary: Generate SEO metadata
 *     tags: [AI — Step 5: Sub-editing]
 */
router.post('/seo-metadata', authenticate, validate(simpleArticleIdSchema), async (req, res) => {
  await LATENCY.haiku();
  return ok(res, {
    metaTitle: 'Beyond Headlines: Exploring Fuel Price Impact',
    metaDescription: 'A deep dive into how changing fuel costs are impacting consumers in Dhaka and beyond.',
    keywords: ['fuel', 'bangladesh', 'inflation', 'economy'],
    generatedAt: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /ai/score-headlines:
 *   post:
 *     summary: Score headline variants
 *     tags: [AI — Step 5: Sub-editing]
 */
router.post('/score-headlines', authenticate, validate(headlineScoreSchema), async (req, res) => {
  await LATENCY.sonnet();
  const scores = req.body.headlines.map((h: string) => ({
    headline: h,
    score: Math.floor(Math.random() * 40) + 60,
    feedback: 'Good keywords used.'
  }));
  return ok(res, { scores, generatedAt: new Date().toISOString() });
});

/**
 * @swagger
 * /ai/packaging:
 *   post:
 *     summary: Generate image concept, pull quotes, and social captions
 *     tags: [AI — Step 6: Packaging]
 */
router.post('/packaging', authenticate, validate(simpleArticleIdSchema), async (req, res) => {
  await LATENCY.haiku();
  return ok(res, {
    imageConcept: 'A vibrant photo of a Dhaka street with energy-efficient transport.',
    pullQuotes: ['The future of energy is here.'],
    socialCaptions: { twitter: 'How is Bangladesh navigating the energy crisis?', facebook: 'Read our latest analysis.' },
    generatedAt: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /ai/image-concept:
 *   post:
 *     summary: Generate image concept
 *     tags: [AI — Step 6: Packaging]
 */
router.post('/image-concept', authenticate, validate(simpleArticleIdSchema), async (req, res) => {
  await LATENCY.haiku();
  return ok(res, { concept: 'Abstract visual of economic growth lines.', generatedAt: new Date().toISOString() });
});

/**
 * @swagger
 * /ai/social-captions:
 *   post:
 *     summary: Generate social captions
 *     tags: [AI — Step 6: Packaging]
 */
router.post('/social-captions', authenticate, validate(simpleArticleIdSchema), async (req, res) => {
  await LATENCY.haiku();
  return ok(res, { captions: ['#News #Update', 'Stay informed.'], generatedAt: new Date().toISOString() });
});

/**
 * @swagger
 * /ai/pull-quotes:
 *   post:
 *     summary: Generate pull quotes
 *     tags: [AI — Step 6: Packaging]
 */
router.post('/pull-quotes', authenticate, validate(simpleArticleIdSchema), async (req, res) => {
  await LATENCY.haiku();
  return ok(res, { quotes: ['Stability is key to progress.'], generatedAt: new Date().toISOString() });
});

export default router;
