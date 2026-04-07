import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import { db } from '../db/client';

export interface ScrapedArticle {
  headline: string;
  url:      string;
  source:   string;
}

const SOURCES = [
  {
    name:     'PROTHOM_ALO',
    url:      'https://www.prothomalo.com/bangladesh',
    selector: 'h3 span', // Common for prothom alo titles
  },
  {
    name:     'DAILY_STAR',
    url:      'https://www.thedailystar.net/bangladesh',
    selector: 'h3.title a, h1.title a', 
  },
  {
    name:     'DHAKA_TRIBUNE',
    url:      'https://www.dhakatribune.com/bangladesh',
    selector: 'h2.title a, h3.title a',
  },
  {
    name:     'JUGANTOR',
    url:      'https://www.jugantor.com/bangladesh',
    selector: 'h3 a',
  },
  {
    name:     'ITTEFAQ',
    url:      'https://www.ittefaq.com.bd/bangladesh',
    selector: 'h2 a, h3 a',
  }
];

export async function scrapeAllSources(): Promise<ScrapedArticle[]> {
  const browser = await chromium.launch({ headless: true });
  const allHeadlines: ScrapedArticle[] = [];

  for (const source of SOURCES) {
    try {
      console.log(`[Scraper] Fetching ${source.name} from ${source.url}`);
      const page = await browser.newPage();
      
      // Navigate with timeout and wait until network is idle
      await page.goto(source.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Get the HTML content
      const content = await page.content();
      const $ = cheerio.load(content);
      
      $(source.selector).each((_, el) => {
        const headline = $(el).text().trim();
        let href       = $(el).attr('href') || ($(el).is('a') ? '' : $(el).closest('a').attr('href'));
        
        if (headline && headline.length > 10) {
          // Normalize URL
          if (href && !href.startsWith('http')) {
            const base = new URL(source.url).origin;
            href = `${base}${href.startsWith('/') ? '' : '/'}${href}`;
          }
          
          allHeadlines.push({
            headline,
            url:    href || source.url,
            source: source.name,
          });
        }
      });

      await page.close();
    } catch (error: any) {
      console.error(`[Scraper] Error scraping ${source.name}:`, error.message);
    }
  }

  await browser.close();
  
  // Basic deduplication by URL
  const unique = Array.from(new Map(allHeadlines.map(h => [h.url, h])).values());
  return unique;
}

export async function persistHeadlines(headlines: ScrapedArticle[]) {
  console.log(`[Scraper] Persisting ${headlines.length} headlines to DB...`);
  
  let count = 0;
  for (const h of headlines) {
    try {
      await db.scrapedHeadline.upsert({
        where: { url: h.url }, // URL is @unique in schema
        update: {
          headline: h.headline, // Update headline if it changed
        }, 
        create: {
          headline: h.headline,
          url:      h.url,
          source:   h.source as any,
        },
      });
      count++;
    } catch (e: any) {
      console.error(`[Scraper] Failed to persist headline: ${h.headline}`, e.message);
    }
  }
  
  return count;
}
