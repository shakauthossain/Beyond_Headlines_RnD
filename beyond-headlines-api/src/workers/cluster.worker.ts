import { Worker } from 'bullmq';
import { redis } from '../redis/client';
import { db } from '../db/client';
import { clusterHeadlines, selectTop3Articles, synthesizeDeepIntelligence } from '../services/ai.service';
import { makeKey, getCached, setCached } from '../redis/cache';
import { config } from '../config';
import * as cheerio from 'cheerio';

const clusterWorker = new Worker(
  'cluster',
  async (job) => {
    const { category = 'General', originalJobId, targetIds, query, params } = job.data;
    console.log(`[ClusterWorker v5] Starting job: ${job.name} (Category: ${category}, Query: ${query || 'None'})`);

    let rawHeadlines: any[] = [];
    
    if (targetIds && targetIds.length > 0) {
      // Manual clustering for specific IDs
      rawHeadlines = await db.scrapedHeadline.findMany({
        where: { id: { in: targetIds } },
        take: 200,
        orderBy: { scrapedAt: 'desc' },
      });
    } else if (query) {
      // TARGETED CLUSTERING: Filter by keyword and timeframe (Fix 1)
      const timeframe = params?.timeframe || 'last_week';
      const timeframeMap: Record<string, string> = {
        'last_24h': '24 hours',
        'last_week': '7 days',
        'last_month': '30 days',
        'any': '100 years'
      };
      const interval = timeframeMap[timeframe] || '7 days';

      // Using ILIKE for simple case-insensitive substring search (more reliable than TSVector)
      rawHeadlines = await db.$queryRawUnsafe(`
        SELECT id, headline, url, source, category, "scrapedAt"
        FROM "ScrapedHeadline"
        WHERE 
          "clusterId" IS NULL 
          AND "category" IN ($1, 'General')
          AND "headline" ILIKE '%' || $2 || '%'
          AND "scrapedAt" > NOW() - INTERVAL '${interval}'
        ORDER BY "scrapedAt" DESC
        LIMIT 200
      `, category, query);

      // FALLBACK: If targeted search yielded 0, broadening to category-wide
      if (rawHeadlines.length === 0) {
        console.log(`[ClusterWorker] Targeted search for "${query}" returned 0 results. Falling back to category: ${category}`);
        rawHeadlines = await db.scrapedHeadline.findMany({
          where: { clusterId: null, category },
          take: 200,
          orderBy: { scrapedAt: 'desc' },
        });
      }
    } else {
      // Legacy behavioral fallback: Cluster all unclustered in category
      rawHeadlines = await db.scrapedHeadline.findMany({
        where: { clusterId: null, category },
        take: 200,
        orderBy: { scrapedAt: 'desc' },
      });
    }

    if (rawHeadlines.length === 0) {
      console.log(`[ClusterWorker] No unclustered headlines found for category: ${category}`);
      if (originalJobId) {
        await redis.set(`discovery:status:${originalJobId}`, 'COMPLETED', 'EX', 3600);
      }
      return { clusterCount: 0 };
    }

    // --- PHASE 1.5: Deep Extraction for Top 3 (New) ---
    const deepScrapedArticles: Record<string, string> = {}; // id -> content

    if (query) {
      console.log(`[ClusterWorker] Identifying Top 3 articles for Deep Extraction...`);
      const topIndices = await selectTop3Articles(query, rawHeadlines.map((h: any) => h.headline));
      
      const topArticles = topIndices.map(idx => rawHeadlines[idx]).filter(Boolean);
      console.log(`[ClusterWorker] Targets for Deep Scrape: ${topArticles.map((a: any) => a.headline).join(' | ')}`);

      for (const article of topArticles) {
        try {
          console.log(`[ClusterWorker] Deep Scraping: ${article.url}`);
          const response = await fetch(article.url, { 
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(10000) 
          });
          
          if (!response.ok) continue;

          const html = await response.text();
          const $ = cheerio.load(html);
          
          // Heuristic for main content
          const content = $('article, main, .story-body, .article-content, #article-body, .post-content')
            .first()
            .text()
            .trim()
            .replace(/\s+/g, ' ')
            .substring(0, 5000); // 5k chars cap

          if (content.length > 300) {
            await db.scrapedHeadline.update({
              where: { id: article.id },
              data: { content }
            });
            deepScrapedArticles[article.id] = content;
            console.log(`[ClusterWorker] Successfully extracted ${content.length} chars for ${article.id}`);
          }
        } catch (e: any) {
          console.error(`[ClusterWorker] Deep Scrape failed for ${article.url}:`, e.message);
        }
      }
    }

    const headlineTexts = rawHeadlines.map((h: any) => h.headline);

    // Check cache first
    const cacheKey = makeKey('cluster', `${category}:${headlineTexts.sort().join('|')}`);
    const cached   = await getCached(cacheKey);

    let clusters: any[];
    const start = Date.now();
    if (cached) {
      console.log('[ClusterWorker] Cache hit — returning cached clusters');
      clusters = cached as any[];
    } else {
      console.log(`[ClusterWorker] Calling AI for ${headlineTexts.length} headlines in ${category}...`);
      clusters = await clusterHeadlines(headlineTexts, category);
      const duration = Date.now() - start;
      console.log(`[ClusterWorker] AI clustering took ${duration}ms`);
      await setCached(cacheKey, clusters, config.clusterCacheTtl);
    }

    // Persist clusters to database
    for (const c of clusters) {
      // Check if cluster contains any deep-scraped articles
      const matchingIndices = c.indices.filter((idx: number) => rawHeadlines[idx]?.id);
      const articleDataForSynthesis = matchingIndices
        .map((idx: number) => ({
          headline: rawHeadlines[idx].headline,
          content: deepScrapedArticles[rawHeadlines[idx].id] || ""
        }))
        .filter((a: { content: string }) => a.content.length > 500)
        .slice(0, 3);

      let finalSummary = c.summary;
      if (articleDataForSynthesis.length > 0) {
        console.log(`[ClusterWorker] Enriching Topic "${c.topic}" with Deep Intelligence...`);
        finalSummary = await synthesizeDeepIntelligence(query || "", c.topic, articleDataForSynthesis);
      }

      const created = await db.cluster.create({
        data: {
          topic:       c.topic,
          summary:     finalSummary,
          sentiment:   c.sentiment,
          category:    category,
          articleCount: c.article_count,
          isEmerging:  c.is_emerging,
        },
      });

      // Link matching headlines
      const matchingIds = c.indices
        .map((idx: number) => rawHeadlines[idx]?.id)
        .filter(Boolean);

      if (matchingIds.length > 0) {
        await db.scrapedHeadline.updateMany({
          where: { id: { in: matchingIds } },
          data:  { clusterId: created.id },
        });
      }
    }

    console.log(`[ClusterWorker] Created ${clusters.length} clusters for ${category}`);
    
    // Finalize status for discovery pipeline tracking
    if (originalJobId) {
      await redis.set(`discovery:status:${originalJobId}`, 'COMPLETED', 'EX', 3600);
    }

    return { clusterCount: clusters.length };
  },
  { connection: redis, concurrency: 2 }
);

clusterWorker.on('completed', (job) => console.log(`[ClusterWorker] Job ${job.id} done`));
clusterWorker.on('failed', (job, err) => console.error(`[ClusterWorker] Job ${job?.id} failed:`, err.message));

console.log('[ClusterWorker] Listening for jobs on queue: cluster');
