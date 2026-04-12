import { Worker, Queue } from 'bullmq';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const db = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const SOURCES = [
  { 
    name: 'PROTHOM_ALO', 
    selector: 'h3 span',
    urls: {
      General: 'https://en.prothomalo.com/bangladesh',
      Sports: 'https://en.prothomalo.com/sports',
      Business: 'https://en.prothomalo.com/business',
      Politics: 'https://en.prothomalo.com/bangladesh',
      Entertainment: 'https://en.prothomalo.com/entertainment'
    }
  },
  { 
    name: 'DAILY_STAR', 
    selector: 'h3.title a, h1.title a',
    urls: {
      General: 'https://www.thedailystar.net/bangladesh',
      Sports: 'https://www.thedailystar.net/sports',
      Business: 'https://www.thedailystar.net/business',
      Politics: 'https://www.thedailystar.net/news/politics',
      Entertainment: 'https://www.thedailystar.net/entertainment'
    }
  },
  { 
    name: 'DHAKA_TRIBUNE', 
    selector: 'h2.title a, h3.title a',
    urls: {
      General: 'https://www.dhakatribune.com/bangladesh',
      Sports: 'https://www.dhakatribune.com/sport',
      Business: 'https://www.dhakatribune.com/business',
      Politics: 'https://www.dhakatribune.com/bangladesh/politics',
      Entertainment: 'https://www.dhakatribune.com/entertainment'
    }
  }
];

async function scrapeAll(query?: string, category: string = 'General') {
  const allHeadlines: any[] = [];
  
  for (const source of SOURCES) {
    try {
      const url = (source.urls as any)[category] || source.urls.General;
      console.log(`[Scraper] Fetching ${source.name} (${category})...`);
      let activeUrl = url;
      let response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      let html = await response.text();
      
      // Check for Meta Refresh Redirect (Dynamic news sites often use this)
      const refreshMatch = html.match(/<meta http-equiv="refresh" content=".*url='(.*)'"/i);
      if (refreshMatch && refreshMatch[1]) {
        activeUrl = refreshMatch[1];
        if (!activeUrl.startsWith('http')) {
           activeUrl = new URL(url).origin + activeUrl;
        }
        console.log(`[Scraper] Following meta-refresh to: ${activeUrl}`);
        response = await fetch(activeUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        html = await response.text();
      }

      const $ = cheerio.load(html);
      
      $(source.selector).each((_, el) => {
        const headline = $(el).text().trim();
        let href = $(el).attr('href') || ($(el).is('a') ? '' : $(el).closest('a').attr('href'));
        
        if (headline && headline.length > 10) {
          if (href && !href.startsWith('http')) {
            const base = new URL(url).origin;
            href = `${base}${href.startsWith('/') ? '' : '/'}${href}`;
          }
          allHeadlines.push({
            headline,
            url: href || url,
            source: source.name
          });
        }
      });
    } catch (err: any) {
      console.error(`[Scraper] Error scraping ${source.name}:`, err.message);
    }
  }

  // Deduplicate
  const unique = Array.from(new Map(allHeadlines.map(h => [h.url, h])).values());
  return unique;
}

const worker = new Worker(
  'scrape', // Queue name
  async (job) => {
    console.log(`[Worker] Processing job: ${job.id} for query: ${job.data.query || 'baseline'} (Category: ${job.data.category || 'General'})`);
    
    // 1. Scrape
    const headlines = await scrapeAll(job.data.query, job.data.category);
    
    // 2. Persist
    console.log(`[Worker] Persisting ${headlines.length} headlines...`);
    let count = 0;
    for (const h of headlines) {
      try {
        await db.scrapedHeadline.upsert({
          where: { url: h.url },
          update: { headline: h.headline },
          create: {
            headline: h.headline,
            url: h.url,
            source: h.source
          }
        });
        count++;
      } catch (e) {}
    }

    // 3. Mark status in Redis
    await redis.set(`discovery:status:${job.id}`, 'SCRAPING_DONE', 'EX', 3600);

    // 4. Dispatch clustering (Optional: the main API can also catch the 'completed' event, 
    // but for continuity we can trigger the cluster queue here if we have its definition)
    // Actually, for a clean extraction, let's keep the pipeline flow logic.
    // We'll use a simple Redis call to add to the cluster queue if needed, 
    // or just let the main API orchestrate. 
    // For now, I'll port exactly what was in scrape.worker.ts.
    
    const clusterQueue = new Queue('cluster', { connection: redis });
    await clusterQueue.add('run-clustering', { 
      headlineCount: count, 
      originalJobId: job.id 
    }, { 
      removeOnComplete: true,
      jobId: `cluster-${job.id}` // Use consistent ID to avoid duplicates
    });
    
    console.log(`[Worker] Dispatched clustering for ${count} headlines.`);
    return { count };
  },
  { connection: redis, concurrency: 1 }
);

worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} completed.`));
worker.on('failed', (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err));

console.log('🚀 Independent Scraper Service Started');
