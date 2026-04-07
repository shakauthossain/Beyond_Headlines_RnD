export type ArticleStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type Tone = 'ANALYTICAL' | 'CRITICAL' | 'EXPLANATORY';
export type UserRole = 'ADMIN' | 'EDITOR';
export type Source = 'PROTHOM_ALO' | 'DAILY_STAR' | 'BDNEWS24' | 'JUGANTOR' | 'DHAKA_TRIBUNE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  password?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface MediaAsset {
  id: string;
  url: string;
  type: string;
  filename: string;
  size: number;
  createdAt: string;
  alt?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  body: any; // Tiptap JSON or string content
  excerpt?: string;
  status: ArticleStatus;
  categoryId?: string;
  authorId: string;
  tagIds: string[];
  bannerImage?: string;
  angle?: string;
  tone?: Tone;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleRevision {
  id: string;
  articleId: string;
  body: any;
  title: string;
  createdAt: string;
  authorId: string;
}

export interface ScrapedHeadline {
  id: string;
  headline: string;
  url: string;
  source: Source;
  scrapedAt: string;
  clusterId?: string;
}

export interface TopicCluster {
  id: string;
  topic: string;
  summary: string;
  sentiment: 'critical' | 'neutral' | 'supportive';
  article_count: number;
  is_emerging: boolean;
  createdAt: string;
}

export interface ResearchSession {
  id: string;
  articleId: string;
  angle: string;
  sources: any[];
  timeline: any[];
  dataPoints: any[];
  gaps: any[];
  createdAt: string;
}
