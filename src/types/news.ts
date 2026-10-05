import { NewsCategory } from "@/config/feeds";

export type { NewsCategory };

export type SummaryStatus = "pending" | "processing" | "completed" | "failed";

export interface PersonItem {
  name: string;
  role: string;
  involvement: string;
}

export interface OrganizationItem {
  name: string;
  type?: string;
  role?: string;
  involvement?: string;
}

export interface FinancialMetricItem {
  metric: string;
  value: string;
  context: string;
}

export interface TechnologySummary {
  headline: string;
  overview: string;
  background: string;
  what_happened: string;
  key_details: string[];
  technology_explained: string;
  people: PersonItem[];
  companies_and_organizations: Array<{
    name: string;
    involvement: string;
    type?: string;
  }>;
  statements_and_claims: string[];
  impact: string;
  future_developments: string[];
  key_takeaways: string[];
  category: "Technology";
}

export interface BusinessSummary {
  headline: string;
  overview: string;
  background: string;
  what_happened: string;
  business_details: string[];
  financial_details: FinancialMetricItem[];
  regulatory_context: string;
  market_economic_context: string;
  companies_and_organizations: Array<{
    name: string;
    type: string;
    role: string;
  }>;
  people: PersonItem[];
  statements_and_claims: string[];
  impact: string;
  risks_and_uncertainties: string[];
  future_developments: string[];
  key_takeaways: string[];
  category: "Business";
}

export type ArticleSummary = TechnologySummary | BusinessSummary;

export interface RssArticle {
  id?: string;
  source?: string;
  title: string;
  url: string;
  guid?: string | null;
  description: string;
  imageUrl?: string | null;
  publishedAt: Date;
  category: NewsCategory;
  author?: string;
}

export interface ArticleDocument {
  _id: string;
  source: string;
  sourceUrl: string;
  guid?: string | null;
  title: string;
  description: string;
  content: string;
  imageUrl?: string | null;
  category: NewsCategory;
  author: string;
  publishedAt: Date | string;
  fetchedAt: Date | string;
  summarizedAt: Date | string | null;
  summaryStatus: SummaryStatus;
  summaryStartedAt?: Date | string | null;
  retryCount?: number;
  summary: ArticleSummary | null;
  summaryError: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface NewsListResponse {
  articles: ArticleDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  category?: NewsCategory | "all";
  source?: string;
  sources?: string[];
}

export interface NewsStats {
  total: number;
  byCategory: {
    technology: number;
    business: number;
  };
  byStatus: {
    completed: number;
    pending: number;
    processing: number;
    failed: number;
  };
  sources?: string[];
  lastSyncedAt?: string | null;
}
