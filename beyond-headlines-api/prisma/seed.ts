import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding database...');

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminPassword  = await bcrypt.hash('password', 10);
  const editorPassword = await bcrypt.hash('password', 10);

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@beyondheadlines.com' },
    update: {},
    create: {
      email:    'admin@beyondheadlines.com',
      name:     'Zia Ahmed',
      role:     'ADMIN',
      password: adminPassword,
    },
  });

  const editor = await prisma.user.upsert({
    where:  { email: 'editor@beyondheadlines.com' },
    update: {},
    create: {
      email:    'editor@beyondheadlines.com',
      name:     'Farah Karim',
      role:     'EDITOR',
      password: editorPassword,
    },
  });

  console.log(`[Seed] Users: admin(${admin.id}), editor(${editor.id})`);

  // ── Categories ─────────────────────────────────────────────────────────────
  const politics = await prisma.category.upsert({
    where:  { slug: 'politics' },
    update: {},
    create: { name: 'Politics', slug: 'politics' },
  });

  const economy = await prisma.category.upsert({
    where:  { slug: 'economy' },
    update: {},
    create: { name: 'Economy', slug: 'economy' },
  });

  const energy = await prisma.category.upsert({
    where:  { slug: 'energy' },
    update: {},
    create: { name: 'Energy', slug: 'energy', parentId: economy.id },
  });

  await prisma.category.upsert({
    where:  { slug: 'technology' },
    update: {},
    create: { name: 'Technology', slug: 'technology' },
  });

  await prisma.category.upsert({
    where:  { slug: 'culture' },
    update: {},
    create: { name: 'Culture', slug: 'culture' },
  });

  console.log('[Seed] Categories created');

  // ── Clusters ───────────────────────────────────────────────────────────────
  let cluster1 = await prisma.cluster.findFirst({ where: { topic: 'Energy Crisis & Fuel Prices' } });
  if (!cluster1) {
    cluster1 = await prisma.cluster.create({
      data: {
        topic:       'Energy Crisis & Fuel Prices',
        summary:     'Ongoing coverage of shifting fuel prices and their impact on consumer costs.',
        sentiment:   'neutral',
        articleCount: 2,
        isEmerging:  true,
      },
    });
  }

  let cluster2 = await prisma.cluster.findFirst({ where: { topic: 'Economic Inflation Trends' } });
  if (!cluster2) {
    cluster2 = await prisma.cluster.create({
      data: {
        topic:       'Economic Inflation Trends',
        summary:     'Analysis of inflation rates and consumer price indices in Bangladesh.',
        sentiment:   'critical',
        articleCount: 1,
        isEmerging:  false,
      },
    });
  }

  console.log('[Seed] Clusters verified/created');

  // ── Scraped Headlines ──────────────────────────────────────────────────────
  const headlines = [
    { headline: 'Fuel oil prices set to decline at consumer level', url: 'https://prothomalo.com/fuel-prices',      source: 'PROTHOM_ALO', clusterId: cluster1.id },
    { headline: 'Inflation eases slightly in March',                url: 'https://thedailystar.net/inflation-march', source: 'DAILY_STAR',  clusterId: cluster2?.id },
    { headline: 'New energy policy focuses on renewables',          url: 'https://dhakatribune.com/energy-policy',   source: 'DHAKA_TRIBUNE', clusterId: cluster1.id },
    { headline: 'Dhaka temperature hits record 40 degrees',         url: 'https://jugantor.com/heatwave',             source: 'JUGANTOR' },
  ];

  for (const h of headlines) {
    await prisma.scrapedHeadline.upsert({
      where: { url: h.url },
      update: {},
      create: h as any,
    });
  }

  console.log('[Seed] Headlines verified/created');

  // ── Articles ───────────────────────────────────────────────────────────────
  const article = await prisma.article.upsert({
    where: { slug: 'fueling-concerns-bangladesh-price-shifts' },
    update: {},
    create: {
      title:       'Fueling Concerns: How Bangladesh is Navigating Global Price Shifts',
      slug:        'fueling-concerns-bangladesh-price-shifts',
      body:        { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'The recent adjustment in fuel prices marks a pivotal shift...' }] }] },
      excerpt:     'An in-depth look at the recent drop in fuel prices.',
      status:      'PUBLISHED',
      categoryId:  energy.id,
      authorId:    admin.id,
      tags:        ['bangladesh', 'fuel-prices', 'economy'],
      angle:       'How fuel price adjustments affect local transportation costs.',
      tone:        'ANALYTICAL',
      metaTitle:   'Fuel Prices in Bangladesh: 2024 Policy Shifts',
      metaDescription: 'Analysis of the new automatic fuel pricing formula and its impact on the economy.',
      publishedAt: new Date(),
    },
  });

  await prisma.revision.create({
    data: {
      articleId: article.id,
      authorId:  admin.id,
      title:     'Fueling Concerns v1',
      body:      { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Initial draft content...' }] }] },
    },
  });

  console.log(`[Seed] Article verified/created: ${article.slug}`);

  // ── Selector Configs (Discovery Engine) ────────────────────────────────────
  const selectorConfigs = [
    {
      sourceName: 'DAILY_STAR',
      urlSlug:    'https://www.thedailystar.net/tags/{query}',
      selector:   'h3.card-title a',
      category:   'Search',
      isActive:   true,
    },
    {
      sourceName: 'PROTHOM_ALO',
      urlSlug:    'https://www.prothomalo.com/search?q={query}',
      selector:   'a.title-link',
      category:   'Search',
      isActive:   true,
    },
    {
      sourceName: 'DHAKA_TRIBUNE',
      urlSlug:    'https://www.dhakatribune.com/topic/{query}',
      selector:   'a.link_overlay',
      category:   'Search',
      isActive:   true,
    },
  ];

  for (const config of selectorConfigs) {
    await (prisma as any).selectorConfig.upsert({
      where: {
        sourceName_category: {
          sourceName: config.sourceName,
          category:   config.category,
        },
      },
      update: {
        urlSlug:  config.urlSlug,
        selector: config.selector,
        isActive: config.isActive,
      },
      create: config,
    });
  }

  console.log('[Seed] Discovery SelectorConfigs initialized');
  console.log('[Seed] ✅ Done!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
