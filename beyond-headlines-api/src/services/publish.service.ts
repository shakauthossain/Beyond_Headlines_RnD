import { Article } from '../types';

export class PublishService {
  static validateChecklist(article: Article): string[] {
    const missing: string[] = [];
    if (!article.bannerImage) missing.push('Headline Image Concept');
    if (!article.metaDescription) missing.push('SEO Meta Description');
    if (article.tagIds.length === 0) missing.push('At least one Category/Tag');
    if (article.title.length < 10) missing.push('Headline minimum length (10 chars)');
    return missing;
  }

  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }

  static async publish(articleId: string): Promise<any> {
    // In a real app, fire Google Analytics event + Register Ad Manager
    return {
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString()
    };
  }
}
