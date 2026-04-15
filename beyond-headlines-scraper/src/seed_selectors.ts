import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const rawSeeds = [
  // ─── SEARCH (Query-based) ───────────────────────────────────────────
  // These selectors are used when user searches for a specific topic/query
  { source: 'PROTHOM_ALO',   cat: 'Search', url: 'https://www.prothomalo.com/search?q={query}', sel: '.md-story-title, h3 a, .headline, article h2, article h3' },
  { source: 'DAILY_STAR',    cat: 'Search', url: 'https://www.thedailystar.net/search?t={query}', sel: 'h3.title a, h2.title a, .field-content a, h3 a' },
  { source: 'BDNEWS24',      cat: 'Search', url: 'https://www.bdnews24.com/search?q={query}', sel: 'h3 a, h2 a, .title a, .field-content a' },
  { source: 'DHAKA_TRIBUNE', cat: 'Search', url: 'https://www.dhakatribune.com/search?q={query}', sel: 'h2.title a, h3.title a, .news_title a, h2 a' },
  { source: 'JUGANTOR',      cat: 'Search', url: 'https://www.jugantor.com/search?q={query}', sel: 'h3 a, h2 a, .title a, .headline a' },
  { source: 'ITTEFAQ',       cat: 'Search', url: 'https://www.ittefaq.com.bd/search?q={query}', sel: 'h2 a, h3 a, .title a, .news-title a' },

  // ─── GENERAL (Homepage/Front-page) ─────────────────────────────────
  // These selectors crawl the main homepage/feed
  { source: 'PROTHOM_ALO',   cat: 'General', url: 'https://www.prothomalo.com', sel: 'h3 span, .headline, .md-story-title, article h2, article h3' },
  { source: 'DAILY_STAR',    cat: 'General', url: 'https://www.thedailystar.net', sel: 'h3.title a, h1.title a, .field-content a, h2.title a' },
  { source: 'BDNEWS24',      cat: 'General', url: 'https://www.bdnews24.com', sel: 'h3 a, h2 a, .title a, .field-content a' },
  { source: 'DHAKA_TRIBUNE', cat: 'General', url: 'https://www.dhakatribune.com', sel: 'h2.title a, h3.title a, .news_title a, h2 a' },
  { source: 'JUGANTOR',      cat: 'General', url: 'https://www.jugantor.com', sel: 'h3 a, h2 a, .title a, .headline a' },
  { source: 'ITTEFAQ',       cat: 'General', url: 'https://www.ittefaq.com.bd', sel: 'h2 a, h3 a, .title a, .news-title a' },

  // ─── CATEGORY-SPECIFIC ──────────────────────────────────────────────
  // Business / Finance
  { source: 'PROTHOM_ALO',   cat: 'business', url: 'https://www.prothomalo.com/business', sel: '.headline, h3 span, .md-story-title' },
  { source: 'PROTHOM_ALO',   cat: 'finance',  url: 'https://www.prothomalo.com/business', sel: '.headline, h3 span, .md-story-title' },
  { source: 'DAILY_STAR',    cat: 'business', url: 'https://www.thedailystar.net/business', sel: 'h3.title a, h2.title a' },
  { source: 'DAILY_STAR',    cat: 'finance',  url: 'https://www.thedailystar.net/business', sel: 'h3.title a, h2.title a' },
  { source: 'DHAKA_TRIBUNE', cat: 'finance',  url: 'https://www.dhakatribune.com/business', sel: 'h2.title a, h3.title a' },

  // Politics
  { source: 'PROTHOM_ALO',   cat: 'politics', url: 'https://www.prothomalo.com/politics', sel: '.headline, h3 span, .md-story-title' },
  { source: 'DAILY_STAR',    cat: 'politics', url: 'https://www.thedailystar.net/news/politics', sel: 'h3.title a, h2.title a' },
  { source: 'DHAKA_TRIBUNE', cat: 'politics', url: 'https://www.dhakatribune.com/bangladesh/politics', sel: 'h2.title a, h3.title a' },
  
  // Sports
  { source: 'PROTHOM_ALO',   cat: 'sports',   url: 'https://www.prothomalo.com/sports', sel: '.headline, h3 span, .md-story-title' },
  { source: 'DAILY_STAR',    cat: 'sports',   url: 'https://www.thedailystar.net/sports', sel: 'h3.title a, h2.title a' },
  { source: 'DHAKA_TRIBUNE', cat: 'sports',   url: 'https://www.dhakatribune.com/sport', sel: 'h2.title a, h3.title a' },

  // Technology / Science
  { source: 'DAILY_STAR',    cat: 'technology', url: 'https://www.thedailystar.net/science-technology', sel: 'h3.title a, h2.title a' },
  { source: 'DHAKA_TRIBUNE', cat: 'technology', url: 'https://www.dhakatribune.com/technology', sel: 'h2.title a, h3.title a' },

  // International / World News
  { source: 'PROTHOM_ALO',   cat: 'international', url: 'https://www.prothomalo.com/international', sel: '.headline, h3 span, .md-story-title' },
  { source: 'DAILY_STAR',    cat: 'international', url: 'https://www.thedailystar.net/bangladesh/world', sel: 'h3.title a, h2.title a' },
  { source: 'DHAKA_TRIBUNE', cat: 'international', url: 'https://www.dhakatribune.com/world', sel: 'h2.title a, h3.title a' }
];

async function run() {
  console.log('Upserting specialized SelectorConfigs...');
  
  // Clear old ones first to ensure user spec mappings are clean
  await db.selectorConfig.deleteMany({});

  for (const s of rawSeeds) {
    await db.selectorConfig.create({
      data: {
        sourceName: s.source,
        category:   s.cat,
        urlSlug:    s.url,
        selector:   s.sel,
        isActive:   true
      }
    });
  }
  console.log('Seeding Done!');
}

run().catch(console.error).finally(() => db.$disconnect());
