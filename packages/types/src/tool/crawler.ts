import type { CrawlErrorResult, CrawlSuccessResult } from '@lobechat/web-crawler';

export interface CrawlSinglePageQuery {
  crawlProvider?: string;
  url: string;
}

export interface CrawlMultiPagesQuery {
  crawlProvider?: string;
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
