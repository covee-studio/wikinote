// Shared non-source-specific types.
// WikiArticle has been moved to sources/wikipedia.tsx as WikiArticleRaw
// (internal to that adapter). Only Language and error shapes remain here.

export interface Language {
  id: string;
  name: string;
  flag: string;
  api: string;
  article: string;
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
