import { Worker, Queue } from 'bullmq';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config();

const db = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

async function scrapeSources(category: string, jobId: string, searchSlug?: string, refinedQuery?: string) {
  const allHeadlines: any[] = [];
  
  // 1. Fetch live configurations from Postgres
  // If searchSlug is provided, we strictly use the 'Search' category templates
  const targetCategory = searchSlug ? 'Search' : category;
  const configs = await db.selectorConfig.findMany({
    where: { category: targetCategory, isActive: true }
  });

  if (configs.length === 0) {
    console.warn(`[Scraper] No active SelectorConfigs found for category: ${targetCategory}`);
    return [];
  }

  // 2. Fetch all sources concurrently using Promise.allSettled
  const scrapePromises = configs.map(async (config) => {
    let sourceHeadlines = 0;
    try {
      // SMART QUERY SELECTION:
      // - If URL looks like a Search page, use full Refined Query for precision
      // - If URL looks like a Tag/Topic page, use Search Slug for stability
      let queryValue = searchSlug || '';
      
      if (refinedQuery) {
        const isSearchPage = config.urlSlug.includes('search?q=') || 
                            config.urlSlug.includes('search?t=') || 
                            config.urlSlug.includes('?query=');
        
        if (isSearchPage) {
          queryValue = refinedQuery;
        }
      }

      const finalUrl = queryValue 
        ? config.urlSlug.replace(/{query}/g, encodeURIComponent(queryValue))
        : config.urlSlug;

      console.log(`[Scraper v6] Fetching ${config.sourceName} (${targetCategory}) -> ${finalUrl}`);
      
      const response = await fetch(finalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(15000) // 15s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      let html = await response.text();
      const $ = cheerio.load(html);
      
      $(config.selector).each((_, el) => {
        const headlineText = $(el).text().trim();
        let href = $(el).attr('href');
        
        if (!href && $(el).is('a')) href = $(el).attr('href');
        if (!href) href = $(el).closest('a').attr('href');

        if (headlineText && headlineText.length > 20) {
          let absoluteUrl = href || finalUrl;
          
          if (href) {
            if (href.startsWith('//')) {
              absoluteUrl = `https:${href}`;
            } else if (href.startsWith('/')) {
              const origin = new URL(finalUrl).origin;
              absoluteUrl = `${origin}${href}`;
            } else if (!href.startsWith('http')) {
              absoluteUrl = `${finalUrl.replace(/\/+$/, '')}/${href}`;
            }
          }

          allHeadlines.push({
            headline: headlineText,
            url: absoluteUrl,
            source: config.sourceName,
            category
          });
          sourceHeadlines++;
        }
      });

      // 3. Telemetry: Check result count for Soft Failures
      if (sourceHeadlines < 5) {
        console.warn(`[Telemetry] ${config.sourceName} returned only ${sourceHeadlines} headlines.`);
        await db.alertLog.create({
          data: {
            source: config.sourceName,
            selectorUsed: config.selector,
            resultCount: sourceHeadlines,
            jobId: jobId,
          }
        });
      } else {
        await db.selectorConfig.update({
          where: { id: config.id },
          data: { lastSuccessAt: new Date() }
        });
      }

    } catch (err: any) {
      console.error(`[Scraper] Error scraping ${config.sourceName}: ${err.message}`);
      await db.alertLog.create({
        data: {
          source: config.sourceName,
          selectorUsed: config.selector,
          resultCount: 0,
          jobId: jobId,
        }
      });
    }
  });

  await Promise.allSettled(scrapePromises);

  // 4. Deduplication
  const unique = Array.from(new Map(allHeadlines.map(h => [h.url, h])).values());
  return unique;
}

const worker = new Worker(
  'scrape',
  async (job) => {
    let category = 'General';
    let query = '';
    let searchSlug = '';

    // Handle payload structural changes generically
    if (job.data.params) {
      category = job.data.params.category;
      query = job.data.params.refinedQuery || job.data.query; // Use refined query if available
      searchSlug = job.data.params.searchSlug;
    } else {
      category = job.data.category || 'General';
      query = job.data.query || '';
      searchSlug = job.data.searchSlug || '';
    }

    console.log(`[Worker] Processing job: ${job.id} | Slug: ${searchSlug || 'None'} | Query: ${query || 'baseline'}`);
    
    // Targeted Search-First Scrape (Hybrid Mode)
    let headlines = await scrapeSources(category, String(job.id), searchSlug, query);

    console.log(`[Worker] Persisting ${headlines.length} unique headlines safely to Database...`);
    let count = 0;
    for (const h of headlines) {
      try {
        await db.scrapedHeadline.upsert({
          where: { url: h.url },
          update: { 
            headline: h.headline, 
            category: h.category,
            clusterId: null,      // Disconnect so it re-enters the fresh clustering pool
            scrapedAt: new Date() // Force timestamp refresh
          },
          create: {
            headline: h.headline,
            url: h.url,
            source: h.source,
            category: h.category
          }
        });
        count++;
      } catch (e: any) {
        console.error(`[Worker] Upsert error: ${e.message}`);
      }
    }

    // 5. Fallback Trigger: If local results are low, trigger Perplexity discovery
    if (count < 5 && job.data.params) {
      console.log(`[Worker] Low results (${count}). Triggering Perplexity fallback...`);
      const discoveryQueue = new Queue('discovery', { connection: redis });
      const { timeframe = 'last_week', region = 'international', refinedQuery } = job.data.params;
      
      await discoveryQueue.add(`fallback-${job.id}`, {
        query: refinedQuery || job.data.query,
        category,
        timeframe,
        region,
        originalJobId: job.id
      }, { removeOnComplete: true });
    }
    
    console.log(`[Worker] Finished Scrape. Dispatched clustering trigger for ${count} headlines.`);
    return { count };
  },
  { connection: redis, concurrency: 5 } // Increased concurrency for robust throughput
);

worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} completed.`));
worker.on('failed', (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err.message));

console.log('🚀 Deterministic Enterprise Scraper Worker Started');
