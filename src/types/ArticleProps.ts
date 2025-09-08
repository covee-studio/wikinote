// Unified article-related type definitions

export interface WikiArticle {
  title: string;
  displaytitle: string;
  extract: string;
  pageid: number;
  url: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
}

export interface ArticleProps {
  article: WikiArticle;
}

export interface Language {
  id: string;
  name: string;
  flag: string;
  api: string;
  article: string;
}

export interface LikedArticlesContextType {
  likedArticles: WikiArticle[];
  toggleLike: (article: WikiArticle) => void;
  isLiked: (pageid: number) => boolean;
}

export interface APIError {
  message: string;
  code?: string;
  retry?: () => void;
}

export interface AppError {
  title: string;
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
}