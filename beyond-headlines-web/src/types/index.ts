export type ArticleStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type Tone = 'ANALYTICAL' | 'CRITICAL' | 'EXPLANATORY';
export type UserRole = 'ADMIN' | 'EDITOR';
export type Source = 'PROTHOM_ALO' | 'DAILY_STAR' | 'BDNEWS24' | 'JUGANTOR' | 'DHAKA_TRIBUNE' | 'ITTEFAQ';

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
  parent?: Category;
  children?: Category[];
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  body: any;
  excerpt?: string;
  status: ArticleStatus;
  categoryId?: string;
  category?: Category;
  authorEmail: string;
  author?: User;
  tags: string[];
  bannerImage?: string;
  angle?: string;
  tone?: Tone;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
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
