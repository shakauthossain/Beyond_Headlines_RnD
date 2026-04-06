import { User, Category, Tag, ScrapedHeadline, TopicCluster, Article, ArticleRevision, ResearchSession, MediaAsset } from '../types';

export let users: User[] = [
  { id: '1', email: 'admin@beyondheadlines.com', name: 'Zia Ahmed', role: 'ADMIN', avatar: 'https://i.pravatar.cc/150?u=zia' },
  { id: '2', email: 'editor@beyondheadlines.com', name: 'Farah Karim', role: 'EDITOR', avatar: 'https://i.pravatar.cc/150?u=farah' },
];

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
  { id: 'h1', title: 'Fuel oil prices set to decline at consumer level', url: 'https://prothomalo.com/fuel-prices', source: 'PROTHOM_ALO', scrapedAt: new Date().toISOString() },
  { id: 'h2', title: 'Inflation eases slightly in March', url: 'https://thedailystar.net/inflation-march', source: 'DAILY_STAR', scrapedAt: new Date().toISOString() },
  { id: 'h3', title: 'Election commission discusses roadmap with stake-holders', url: 'https://bdnews24.com/ec-roadmap', source: 'BDNEWS24', scrapedAt: new Date().toISOString() },
  { id: 'h4', title: 'Dhaka temperature hits record 40 degrees', url: 'https://jugantor.com/heatwave', source: 'JUGANTOR', scrapedAt: new Date().toISOString() },
  { id: 'h5', title: 'New energy policy focuses on renewables', url: 'https://dhakatribune.com/energy-policy', source: 'DHAKA_TRIBUNE', scrapedAt: new Date().toISOString() },
];

export let clusters: TopicCluster[] = [
  { 
    id: 'c1', 
    name: 'Energy Crisis & Fuel Prices', 
    description: 'Ongoing coverage of shifting fuel prices and their impact on consumer costs.', 
    isEmerging: true, 
    headlineIds: ['h1', 'h5'],
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'c2', 
    name: 'Economic Inflation Trends', 
    description: 'Analysis of inflation rates and consumer price indices in Bangladesh.', 
    isEmerging: false, 
    headlineIds: ['h2'],
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'c3', 
    name: 'Electoral Reform Roadmap', 
    description: 'Reports on the Election Commission\'s steps towards the next general election.', 
    isEmerging: false, 
    headlineIds: ['h3'],
    createdAt: new Date().toISOString() 
  },
];

export let articles: Article[] = [
  {
    id: 'a1',
    title: 'Fueling Concerns: How Bangladesh is Navigating Global Price Shifts',
    slug: 'fueling-concerns-bangladesh-price-shifts',
    content: 'The recent adjustment in fuel prices marks a pivotal shift in economic policy...',
    excerpt: 'An in-depth look at the recent drop in fuel prices and what it means for the common man.',
    status: 'PUBLISHED',
    categoryId: '5',
    authorId: '1',
    tagIds: ['1', '2'],
    bannerImage: 'https://picsum.photos/800/400',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'a2',
    title: 'Marching Towards Stability: Inflation Reports for Q1',
    slug: 'stability-inflation-reports-q1',
    content: 'While inflation remains a hurdle, the March data suggests a cooling period...',
    excerpt: 'Analyzing the recent dip in inflation and its implications for the 2024 budget.',
    status: 'DRAFT',
    categoryId: '2',
    authorId: '2',
    tagIds: ['2', '4'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export let revisions: ArticleRevision[] = [
  { id: 'r1', articleId: 'a1', content: 'Initial draft of the fuel article...', createdAt: new Date().toISOString(), authorId: '1' },
];

export let researchSessions: ResearchSession[] = [
  {
    id: 'rs1',
    articleId: 'a1',
    topic: 'Fuel price history in Bangladesh',
    sources: [
      { title: 'World Bank Energy Report', url: 'https://wb.org/energy', credibility: 0.95 },
      { title: 'BPC Annual Statistical Data', url: 'https://bpc.gov.bd/stats', credibility: 0.88 }
    ],
    timeline: [
      { event: 'Fuel price hike of 40%', date: '2022-08-01' },
      { event: 'Introduction of automatic price formula', date: '2023-12-15' }
    ],
    dataPoints: [
      { label: 'Octane price per litre', value: '126 BDT' },
      { label: 'Diesel price per litre', value: '106 BDT' }
    ],
    gaps: ['Impact of regional geopolitical shifts not yet fully quantified in local supply chains.'],
    synthesis: 'The transition to an automatic pricing mechanism is intended to reduce government subsidy pressure but remains sensitive to global Brent crude fluctuations.',
    createdAt: new Date().toISOString(),
  },
];

export let mediaAssets: MediaAsset[] = [
  { id: 'm1', url: 'https://picsum.photos/800/400', type: 'IMAGE', filename: 'fuel-refinery.jpg', size: 245000, createdAt: new Date().toISOString() },
];
