import type { CrawlErrorResult, CrawlSuccessResult } from '@lobechat/web-crawler';

export interface CrawlSinglePageQuery {
  provider?: string;
  url: string;
}

export interface CrawlMultiPagesQuery {
  provider?: string;
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
