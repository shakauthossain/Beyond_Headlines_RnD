import { Worker } from 'bullmq';
import { redis } from '../redis/client';
import { db } from '../db/client';
import { clusterHeadlines } from '../services/ai.service';
import { makeKey, getCached, setCached } from '../redis/cache';
import { config } from '../config';

const clusterWorker = new Worker(
  'cluster',
  async (job) => {
    console.log(`[ClusterWorker] Starting job: ${job.name}`);

    // Pull latest unprocessed headlines from DB
    const rawHeadlines = await db.scrapedHeadline.findMany({
      where:  { clusterId: null },
      take:   200,
      orderBy: { scrapedAt: 'desc' },
    });

    if (rawHeadlines.length === 0) {
      console.log('[ClusterWorker] No unclustered headlines found');
      return;
    }

    const headlineTexts = rawHeadlines.map((h: any) => h.headline);

    // Check cache first
    const cacheKey = makeKey('cluster', headlineTexts.sort().join('|'));
    const cached   = await getCached(cacheKey);

    let clusters: any[];
    if (cached) {
      console.log('[ClusterWorker] Cache hit — returning cached clusters');
      clusters = cached as any[];
    } else {
      clusters = await clusterHeadlines(headlineTexts);
      await setCached(cacheKey, clusters, config.clusterCacheTtl);
    }

    // Persist clusters to database
    for (const c of clusters) {
      const created = await db.cluster.create({
        data: {
          topic:       c.topic,
          summary:     c.summary,
          sentiment:   c.sentiment,
          articleCount: c.article_count,
          isEmerging:  c.is_emerging,
        },
      });

      // Link matching headlines to this cluster
      const matchingIds = rawHeadlines
        .filter((h: any) => headlineTexts.slice(0, c.article_count).includes(h.headline))
        .map((h: any) => h.id);

      await db.scrapedHeadline.updateMany({
        where: { id: { in: matchingIds } },
        data:  { clusterId: created.id },
      });
    }

    console.log(`[ClusterWorker] Created ${clusters.length} clusters`);
    return { clusterCount: clusters.length };
  },
  { connection: redis, concurrency: 2 },
);

clusterWorker.on('completed', (job) => console.log(`[ClusterWorker] Job ${job.id} done`));
clusterWorker.on('failed',    (job, err) => console.error(`[ClusterWorker] Job ${job?.id} failed:`, err.message));

console.log('[ClusterWorker] Listening for jobs on queue: cluster');
