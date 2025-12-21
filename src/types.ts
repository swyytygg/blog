export enum PostStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  PRIVATE = 'PRIVATE'
}

export interface Author {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  status: PostStatus;
  views: number;
  category: string;
  publishedAt: string; // ISO Date string
  author: Author;
}

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number; // percentage
}