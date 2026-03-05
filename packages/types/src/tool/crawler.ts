import type { CrawlErrorResult, CrawlSuccessResult } from '@lobechat/web-crawler';

export enum CrawlProviderType {
  Browserless = 'browserless',
  Exa = 'exa',
  Firecrawl = 'firecrawl',
  Jina = 'jina',
  Naive = 'naive',
  Search1API = 'search1api',
  Tavily = 'tavily',
}

export interface CrawlSinglePageQuery {
  provider?: CrawlProviderType;
  url: string;
}

export interface CrawlMultiPagesQuery {
  provider?: CrawlProviderType;
  urls: string[];
}

export interface CrawlMultiPagesQuery {
  provider?: CrawlProviderType;
  urls: string[];
}

export interface CrawlResult {
  crawler: string;
  data: CrawlSuccessResult | CrawlErrorResult;
  originalUrl: string;
}

export interface CrawlPluginState {
  results: CrawlResult[];
}
