import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[Seed] Seeding database...");

  // ── Identities (Emails) ──────────────────────────────────────────────────
  const adminEmail = "admin@beyondheadlines.com";
  const editorEmail = "editor@beyondheadlines.com";

  console.log(`[Seed] Using identifies: admin(${adminEmail}), editor(${editorEmail})`);

  // ── Categories ─────────────────────────────────────────────────────────────
  const politics = await prisma.category.upsert({
    where: { slug: "politics" },
    update: {},
    create: { name: "Politics", slug: "politics" },
  });

  const economy = await prisma.category.upsert({
    where: { slug: "economy" },
    update: {},
    create: { name: "Economy", slug: "economy" },
  });

  const energy = await prisma.category.upsert({
    where: { slug: "energy" },
    update: {},
    create: { name: "Energy", slug: "energy", parentId: economy.id },
  });

  await prisma.category.upsert({
    where: { slug: "technology" },
    update: {},
    create: { name: "Technology", slug: "technology" },
  });

  await prisma.category.upsert({
    where: { slug: "culture" },
    update: {},
    create: { name: "Culture", slug: "culture" },
  });

  console.log("[Seed] Categories created");

  // ── Clusters ───────────────────────────────────────────────────────────────
  let cluster1 = await prisma.cluster.findFirst({
    where: { topic: "Energy Crisis & Fuel Prices" },
  });
  if (!cluster1) {
    cluster1 = await prisma.cluster.create({
      data: {
        topic: "Energy Crisis & Fuel Prices",
        summary:
          "Ongoing coverage of shifting fuel prices and their impact on consumer costs.",
        sentiment: "neutral",
        articleCount: 2,
        isEmerging: true,
      },
    });
  }

  let cluster2 = await prisma.cluster.findFirst({
    where: { topic: "Economic Inflation Trends" },
  });
  if (!cluster2) {
    cluster2 = await prisma.cluster.create({
      data: {
        topic: "Economic Inflation Trends",
        summary:
          "Analysis of inflation rates and consumer price indices in Bangladesh.",
        sentiment: "critical",
        articleCount: 1,
        isEmerging: false,
      },
    });
  }

  console.log("[Seed] Clusters verified/created");

  // ── Scraped Headlines ──────────────────────────────────────────────────────
  const headlines = [
    {
      headline: "Fuel oil prices set to decline at consumer level",
      url: "https://prothomalo.com/fuel-prices",
      source: "PROTHOM_ALO",
      clusterId: cluster1.id,
    },
    {
      headline: "Inflation eases slightly in March",
      url: "https://thedailystar.net/inflation-march",
      source: "DAILY_STAR",
      clusterId: cluster2?.id,
    },
    {
      headline: "New energy policy focuses on renewables",
      url: "https://dhakatribune.com/energy-policy",
      source: "DHAKA_TRIBUNE",
      clusterId: cluster1.id,
    },
    {
      headline: "Dhaka temperature hits record 40 degrees",
      url: "https://jugantor.com/heatwave",
      source: "JUGANTOR",
    },
  ];

  for (const h of headlines) {
    await prisma.scrapedHeadline.upsert({
      where: { url: h.url },
      update: {},
      create: h as any,
    });
  }

  console.log("[Seed] Headlines verified/created");

  // ── Articles ───────────────────────────────────────────────────────────────
  const article = await prisma.article.upsert({
    where: { slug: "fueling-concerns-bangladesh-price-shifts" },
    update: {},
    create: {
      title:
        "Fueling Concerns: How Bangladesh is Navigating Global Price Shifts",
      slug: "fueling-concerns-bangladesh-price-shifts",
      body: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "The recent adjustment in fuel prices marks a pivotal shift...",
              },
            ],
          },
        ],
      },
      excerpt: "An in-depth look at the recent drop in fuel prices.",
      status: "PUBLISHED",
      categoryId: energy.id,
      authorEmail: adminEmail,
      tags: ["bangladesh", "fuel-prices", "economy"],
      angle: "How fuel price adjustments affect local transportation costs.",
      tone: "ANALYTICAL",
      metaTitle: "Fuel Prices in Bangladesh: 2024 Policy Shifts",
      metaDescription:
        "Analysis of the new automatic fuel pricing formula and its impact on the economy.",
      publishedAt: new Date(),
    },
  });

  await prisma.revision.create({
    data: {
      articleId: article.id,
      authorEmail: adminEmail,
      title: "Fueling Concerns v1",
      body: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Initial draft content..." }],
          },
        ],
      },
    },
  });

  console.log(`[Seed] Article verified/created: ${article.slug}`);

  // ── Selector Configs (Discovery Engine) ────────────────────────────────────
  // These selectors define how to scrape each news source for different categories
  const selectorConfigs = [
    // ─── SEARCH (Query-based targeting) ───────────────────────────────────
    { sourceName: "PROTHOM_ALO",   category: "Search", urlSlug: "https://www.prothomalo.com/search?q={query}", selector: ".md-story-title, h3 a, .headline, article h2, article h3", isActive: true },
    { sourceName: "DAILY_STAR",    category: "Search", urlSlug: "https://www.thedailystar.net/search?t={query}", selector: "h3.title a, h2.title a, .field-content a, h3 a", isActive: true },
    { sourceName: "BDNEWS24",      category: "Search", urlSlug: "https://www.bdnews24.com/search?q={query}", selector: "h3 a, h2 a, .title a, .field-content a", isActive: true },
    { sourceName: "DHAKA_TRIBUNE", category: "Search", urlSlug: "https://www.dhakatribune.com/search?q={query}", selector: "h2.title a, h3.title a, .news_title a, h2 a", isActive: true },
    { sourceName: "JUGANTOR",      category: "Search", urlSlug: "https://www.jugantor.com/search?q={query}", selector: "h3 a, h2 a, .title a, .headline a", isActive: true },
    { sourceName: "ITTEFAQ",       category: "Search", urlSlug: "https://www.ittefaq.com.bd/search?q={query}", selector: "h2 a, h3 a, .title a, .news-title a", isActive: true },

    // ─── GENERAL (Homepage/Front-page crawl) ──────────────────────────────
    { sourceName: "PROTHOM_ALO",   category: "General", urlSlug: "https://www.prothomalo.com", selector: "h3 span, .headline, .md-story-title, article h2, article h3", isActive: true },
    { sourceName: "DAILY_STAR",    category: "General", urlSlug: "https://www.thedailystar.net", selector: "h3.title a, h1.title a, .field-content a, h2.title a", isActive: true },
    { sourceName: "BDNEWS24",      category: "General", urlSlug: "https://www.bdnews24.com", selector: "h3 a, h2 a, .title a, .field-content a", isActive: true },
    { sourceName: "DHAKA_TRIBUNE", category: "General", urlSlug: "https://www.dhakatribune.com", selector: "h2.title a, h3.title a, .news_title a, h2 a", isActive: true },
    { sourceName: "JUGANTOR",      category: "General", urlSlug: "https://www.jugantor.com", selector: "h3 a, h2 a, .title a, .headline a", isActive: true },
    { sourceName: "ITTEFAQ",       category: "General", urlSlug: "https://www.ittefaq.com.bd", selector: "h2 a, h3 a, .title a, .news-title a", isActive: true },

    // ─── CATEGORY-SPECIFIC ───────────────────────────────────────────────
    // Politics
    { sourceName: "PROTHOM_ALO",   category: "politics", urlSlug: "https://www.prothomalo.com/politics", selector: ".headline, h3 span, .md-story-title", isActive: true },
    { sourceName: "DAILY_STAR",    category: "politics", urlSlug: "https://www.thedailystar.net/news/politics", selector: "h3.title a, h2.title a", isActive: true },
    { sourceName: "DHAKA_TRIBUNE", category: "politics", urlSlug: "https://www.dhakatribune.com/bangladesh/politics", selector: "h2.title a, h3.title a", isActive: true },

    // Business/Finance
    { sourceName: "PROTHOM_ALO",   category: "business", urlSlug: "https://www.prothomalo.com/business", selector: ".headline, h3 span, .md-story-title", isActive: true },
    { sourceName: "DAILY_STAR",    category: "business", urlSlug: "https://www.thedailystar.net/business", selector: "h3.title a, h2.title a", isActive: true },
    { sourceName: "PROTHOM_ALO",   category: "finance", urlSlug: "https://www.prothomalo.com/business", selector: ".headline, h3 span, .md-story-title", isActive: true },
    { sourceName: "DAILY_STAR",    category: "finance", urlSlug: "https://www.thedailystar.net/business", selector: "h3.title a, h2.title a", isActive: true },
    { sourceName: "DHAKA_TRIBUNE", category: "finance", urlSlug: "https://www.dhakatribune.com/business", selector: "h2.title a, h3.title a", isActive: true },

    // Sports
    { sourceName: "PROTHOM_ALO",   category: "sports", urlSlug: "https://www.prothomalo.com/sports", selector: ".headline, h3 span, .md-story-title", isActive: true },
    { sourceName: "DAILY_STAR",    category: "sports", urlSlug: "https://www.thedailystar.net/sports", selector: "h3.title a, h2.title a", isActive: true },
    { sourceName: "DHAKA_TRIBUNE", category: "sports", urlSlug: "https://www.dhakatribune.com/sport", selector: "h2.title a, h3.title a", isActive: true },

    // Technology
    { sourceName: "DAILY_STAR",    category: "technology", urlSlug: "https://www.thedailystar.net/science-technology", selector: "h3.title a, h2.title a", isActive: true },
    { sourceName: "DHAKA_TRIBUNE", category: "technology", urlSlug: "https://www.dhakatribune.com/technology", selector: "h2.title a, h3.title a", isActive: true },

    // International/World News
    { sourceName: "PROTHOM_ALO",   category: "international", urlSlug: "https://www.prothomalo.com/international", selector: ".headline, h3 span, .md-story-title", isActive: true },
    { sourceName: "DAILY_STAR",    category: "international", urlSlug: "https://www.thedailystar.net/bangladesh/world", selector: "h3.title a, h2.title a", isActive: true },
    { sourceName: "DHAKA_TRIBUNE", category: "international", urlSlug: "https://www.dhakatribune.com/world", selector: "h2.title a, h3.title a", isActive: true },
  ];

  for (const config of selectorConfigs) {
    await (prisma as any).selectorConfig.upsert({
      where: {
        sourceName_category: {
          sourceName: config.sourceName,
          category: config.category,
        },
      },
      update: {
        urlSlug: config.urlSlug,
        selector: config.selector,
        isActive: config.isActive,
      },
      create: config,
    });
  }

  console.log("[Seed] Discovery SelectorConfigs initialized");

  // ── Source Language Mappings (Admin Configurable) ──────────────────────────
  const languageMappings = [
    {
      source: "PROTHOM_ALO",
      bengaliDomain: "prothomalo.com",
      englishDomain: "en.prothomalo.com",
      languageStrategy: "ENGLISH_FIRST",
      hasEnglishEdition: true,
      fallbackEnabled: true,
      description: "Prothom Alo - Has separate English edition at en.prothomalo.com",
    },
    {
      source: "DAILY_STAR",
      bengaliDomain: "bangla.thedailystar.net",
      englishDomain: "thedailystar.net",
      languageStrategy: "ENGLISH_FIRST",
      hasEnglishEdition: true,
      fallbackEnabled: true,
      description: "Daily Star - English primary, Bengali at bangla subdomain",
    },
    {
      source: "DHAKA_TRIBUNE",
      bengaliDomain: "dhakatribune.com",
      englishDomain: "dhakatribune.com",
      languageStrategy: "ENGLISH_FIRST",
      hasEnglishEdition: true,
      fallbackEnabled: false,
      description: "Dhaka Tribune - Publishes both languages on same domain",
    },
    {
      source: "JUGANTOR",
      bengaliDomain: "jugantor.com",
      englishDomain: "en.jugantor.com",
      languageStrategy: "ENGLISH_FIRST",
      hasEnglishEdition: false,
      fallbackEnabled: true,
      description: "Jugantor - Primarily Bengali, limited English coverage",
    },
    {
      source: "ITTEFAQ",
      bengaliDomain: "ittefaq.com.bd",
      englishDomain: "ittefaq.com.bd",
      languageStrategy: "BENGALI_ONLY",
      hasEnglishEdition: false,
      fallbackEnabled: false,
      description: "Ittefaq - Primarily Bengali, no English edition",
    },
    {
      source: "BDNEWS24",
      bengaliDomain: "bdnews24.com",
      englishDomain: "bdnews24.com",
      languageStrategy: "ENGLISH_FIRST",
      hasEnglishEdition: true,
      fallbackEnabled: false,
      description: "BDNews24 - Publishes in English (and some Bengali sections)",
    },
  ];

  for (const mapping of languageMappings) {
    await prisma.sourceLanguageMapping.upsert({
      where: { source: mapping.source },
      update: {
        bengaliDomain: mapping.bengaliDomain,
        englishDomain: mapping.englishDomain,
        languageStrategy: mapping.languageStrategy,
        hasEnglishEdition: mapping.hasEnglishEdition,
        fallbackEnabled: mapping.fallbackEnabled,
        description: mapping.description,
      },
      create: {
        ...mapping,
        isActive: true,
      },
    });
  }

  console.log("[Seed] Source Language Mappings initialized");
  console.log("[Seed] ✅ Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
