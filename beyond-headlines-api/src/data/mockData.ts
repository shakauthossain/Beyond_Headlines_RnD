import { Category, Tag, ScrapedHeadline, TopicCluster, Article, ArticleRevision, ResearchSession, MediaAsset } from '../types';

export let categories: Category[] = [
  { id: '1', name: 'Politics', slug: 'politics' },
  { id: '2', name: 'Economy', slug: 'economy' },
  { id: '3', name: 'Technology', slug: 'technology' },
  { id: '4', name: 'Culture', slug: 'culture' },
  { id: '5', name: 'Energy', slug: 'energy', parentId: '2' },
];

export let tags: Tag[] = [
  { id: '1', name: 'Bangladesh', slug: 'bangladesh' },
  { id: '2', name: 'Inflation', slug: 'inflation' },
  { id: '3', name: 'Election', slug: 'election' },
  { id: '4', name: 'Budget', slug: 'budget' },
  { id: '5', name: 'Climate', slug: 'climate' },
];

export let scrapedHeadlines: ScrapedHeadline[] = [
  { id: 'h1', headline: 'Fuel oil prices set to decline at consumer level', url: 'https://prothomalo.com/fuel-prices', source: 'PROTHOM_ALO' as any, scrapedAt: new Date().toISOString(), clusterId: 'c1' },
  { id: 'h2', headline: 'Inflation eases slightly in March', url: 'https://thedailystar.net/inflation-march', source: 'DAILY_STAR' as any, scrapedAt: new Date().toISOString(), clusterId: 'c2' },
  { id: 'h3', headline: 'Election commission discusses roadmap', url: 'https://bdnews24.com/ec-roadmap', source: 'BDNEWS24' as any, scrapedAt: new Date().toISOString(), clusterId: 'c3' },
  { id: 'h4', headline: 'Dhaka temperature hits record 40 degrees', url: 'https://jugantor.com/heatwave', source: 'JUGANTOR' as any, scrapedAt: new Date().toISOString() },
  { id: 'h5', headline: 'New energy policy focuses on renewables', url: 'https://dhakatribune.com/energy-policy', source: 'DHAKA_TRIBUNE' as any, scrapedAt: new Date().toISOString(), clusterId: 'c1' },
];

export let clusters: TopicCluster[] = [
  { 
    id: 'c1', 
    topic: 'Energy Crisis & Fuel Prices', 
    summary: 'Ongoing coverage of shifting fuel prices and their impact on consumer costs.', 
    sentiment: 'neutral',
    article_count: 2,
    is_emerging: true, 
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'c2', 
    topic: 'Economic Inflation Trends', 
    summary: 'Analysis of inflation rates and consumer price indices in Bangladesh.', 
    sentiment: 'critical',
    article_count: 1,
    is_emerging: false, 
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'c3', 
    topic: 'Electoral Reform Roadmap', 
    summary: 'Reports on the Election Commission\'s steps towards the next general election.', 
    sentiment: 'supportive',
    article_count: 1,
    is_emerging: false, 
    createdAt: new Date().toISOString() 
  },
];

export let articles: Article[] = [
  {
    id: 'a1',
    title: 'Fueling Concerns: How Bangladesh is Navigating Global Price Shifts',
    slug: 'fueling-concerns-bangladesh-price-shifts',
    body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'The recent adjustment in fuel prices marks a pivotal shift...' }] }] },
    excerpt: 'An in-depth look at the recent drop in fuel prices.',
    status: 'PUBLISHED',
    categoryId: '5',
    authorEmail: 'admin@beyondheadlines.com',
    tagIds: ['1', '2'],
    angle: 'How fuel price adjustments affect local transportation costs.',
    tone: 'ANALYTICAL',
    bannerImage: 'https://picsum.photos/800/400',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'a2',
    title: 'Marching Towards Stability: Inflation Reports for Q1',
    slug: 'stability-inflation-reports-q1',
    body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'While inflation remains a hurdle...' }] }] },
    status: 'DRAFT',
    categoryId: '2',
    authorEmail: 'editor@beyondheadlines.com',
    tagIds: ['2', '4'],
    tone: 'EXPLANATORY',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export let revisions: ArticleRevision[] = [
  { id: 'r1', articleId: 'a1', title: 'Fueling Concerns v1', body: 'Initial draft content...', createdAt: new Date().toISOString(), authorEmail: 'admin@beyondheadlines.com' },
];

export let researchSessions: ResearchSession[] = [
  {
    id: 'rs1',
    articleId: 'a1',
    angle: 'How fuel price adjustments affect local transportation costs.',
    sources: [
      { title: 'World Bank Energy Report', url: 'https://wb.org/energy', credibility: 1 },
      { title: 'BPC Annual Statistical Data', url: 'https://bpc.gov.bd/stats', credibility: 1 }
    ],
    timeline: [
      { date: '2022-08-01', event: 'Fuel price hike of 40%', source: 'Daily Star' },
      { date: '2023-12-15', event: 'Introduction of automatic price formula', source: 'Prothom Alo' }
    ],
    dataPoints: ['Octane: 126 BDT/Litre', 'Diesel: 106 BDT/Litre'],
    gaps: ['Long-term logistics impact data.'],
    createdAt: new Date().toISOString(),
  },
];

export let mediaAssets: MediaAsset[] = [
  { id: 'm1', url: 'https://picsum.photos/800/400', type: 'IMAGE', filename: 'fuel-refinery.jpg', size: 245000, createdAt: new Date().toISOString(), alt: 'A large fuel refinery' },
];
