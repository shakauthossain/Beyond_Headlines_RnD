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
  type: 'IMAGE' | 'VIDEO' | 'PDF';
  filename: string;
  size: number;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: ArticleStatus;
  categoryId: string;
  authorId: string;
  tagIds: string[];
  bannerImage?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleRevision {
  id: string;
  articleId: string;
  content: string;
  createdAt: string;
  authorId: string;
}

export interface ScrapedHeadline {
  id: string;
  title: string;
  url: string;
  source: Source;
  scrapedAt: string;
}

export interface TopicCluster {
  id: string;
  name: string;
  description: string;
  isEmerging: boolean;
  headlineIds: string[];
  createdAt: string;
}

export interface ResearchSession {
  id: string;
  articleId?: string;
  clusterId?: string;
  topic: string;
  sources: { title: string; url: string; credibility: number }[];
  timeline: { event: string; date: string }[];
  dataPoints: { label: string; value: string }[];
  gaps: string[];
  synthesis: string;
  createdAt: string;
}
