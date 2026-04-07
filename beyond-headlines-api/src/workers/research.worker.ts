import { Worker } from 'bullmq';
import { redis } from '../redis/client';
import { db } from '../db/client';
import { searchPerplexity, synthesiseResearch } from '../services/ai.service';
import { makeKey, getCached, setCached } from '../redis/cache';
import { config } from '../config';

const researchWorker = new Worker(
  'research',
  async (job) => {
    const { articleId, angle } = job.data as { articleId: string; angle: string };
    console.log(`[ResearchWorker] Starting research for article: ${articleId}`);

    const cacheKey = makeKey('research', angle);
    const cached   = await getCached(cacheKey);

    let perplexityResult: { sources: any[]; rawText: string };
    let synthesis: any;

    if (cached) {
      console.log('[ResearchWorker] Cache hit — returning cached research');
      const c = cached as any;
      perplexityResult = { sources: c.sources, rawText: '' };
      synthesis = c;
    } else {
      // Step 1: Perplexity live web search
      perplexityResult = await searchPerplexity(angle);

      // Step 2: Haiku synthesis
      synthesis = await synthesiseResearch(angle, perplexityResult.rawText);

      await setCached(cacheKey, { ...synthesis, sources: perplexityResult.sources }, config.researchCacheTtl);
    }

    // Persist to research_sessions table
    const session = await db.researchSession.create({
      data: {
        articleId,
        angle,
        sources:    perplexityResult.sources,
        timeline:   synthesis.timeline,
        dataPoints: synthesis.data_points,
        gaps:       synthesis.gaps,
      },
    });

    console.log(`[ResearchWorker] Research session created: ${session.id}`);
    return { sessionId: session.id };
  },
  { connection: redis, concurrency: 3 },
);

researchWorker.on('completed', (job) => console.log(`[ResearchWorker] Job ${job.id} done`));
researchWorker.on('failed',    (job, err) => console.error(`[ResearchWorker] Job ${job?.id} failed:`, err.message));

console.log('[ResearchWorker] Listening for jobs on queue: research');
