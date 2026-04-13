import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const rawSeeds = [
  // General (Top level)
  { source: 'PROTHOM_ALO',   cat: 'General', url: 'https://www.prothomalo.com', sel: 'h3 span, .headline' },
  { source: 'DAILY_STAR',    cat: 'General', url: 'https://www.thedailystar.net', sel: 'h3.title a, h1.title a, .field-content a' },
  { source: 'DHAKA_TRIBUNE', cat: 'General', url: 'https://www.dhakatribune.com', sel: 'h2.title a, h3.title a, .news_title a' },
  { source: 'JUGANTOR',      cat: 'General', url: 'https://www.jugantor.com', sel: 'h3 a, .title a' },
  { source: 'ITTEFAQ',       cat: 'General', url: 'https://www.ittefaq.com.bd', sel: 'h2 a, h3 a, .title a' },

  // Business / Finance
  { source: 'PROTHOM_ALO',   cat: 'business', url: 'https://www.prothomalo.com/business', sel: '.headline, h3 span' },
  { source: 'PROTHOM_ALO',   cat: 'finance',  url: 'https://www.prothomalo.com/business', sel: '.headline, h3 span' },
  { source: 'DAILY_STAR',    cat: 'business', url: 'https://www.thedailystar.net/business', sel: 'h3.title a' },
  { source: 'DAILY_STAR',    cat: 'finance',  url: 'https://www.thedailystar.net/business', sel: 'h3.title a' },
  { source: 'DHAKA_TRIBUNE', cat: 'finance',  url: 'https://www.dhakatribune.com/business', sel: 'h2.title a' },

  // Politics
  { source: 'PROTHOM_ALO',   cat: 'politics', url: 'https://www.prothomalo.com/politics', sel: '.headline, h3 span' },
  { source: 'DAILY_STAR',    cat: 'politics', url: 'https://www.thedailystar.net/news/politics', sel: 'h3.title a' },
  { source: 'DHAKA_TRIBUNE', cat: 'politics', url: 'https://www.dhakatribune.com/bangladesh/politics', sel: 'h2.title a' },
  
  // Sports
  { source: 'PROTHOM_ALO',   cat: 'sports',   url: 'https://www.prothomalo.com/sports', sel: '.headline, h3 span' },
  { source: 'DAILY_STAR',    cat: 'sports',   url: 'https://www.thedailystar.net/sports', sel: 'h3.title a' },
  { source: 'DHAKA_TRIBUNE', cat: 'sports',   url: 'https://www.dhakatribune.com/sport', sel: 'h2.title a' },

  // Tech
  { source: 'DAILY_STAR',    cat: 'technology', url: 'https://www.thedailystar.net/science-technology', sel: 'h3.title a' },
  { source: 'DHAKA_TRIBUNE', cat: 'technology', url: 'https://www.dhakatribune.com/technology', sel: 'h2.title a' }
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
