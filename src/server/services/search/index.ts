import type { SearchParams, SearchQuery } from '@lobechat/types';
import type { Crawler, CrawlImplType, CrawlUniformResult } from '@lobechat/web-crawler';
import pMap from 'p-map';

import { toolsEnv } from '@/envs/tools';

import { SearchImplType, type SearchServiceImpl } from './impls';
import { createSearchServiceImpl } from './impls';

const DEFAULT_CRAWL_CONCURRENCY = 3;
const DEFAULT_CRAWLER_RETRY = 1;

const parseImplEnv = (envString: string = '') => {
  // Handle full-width commas and extra whitespace
  const envValue = envString.replaceAll('，', ',').trim();
  return envValue.split(',').filter(Boolean);
};

/**
 * Search service class
 * Uses different implementations for different search operations
 */
export class SearchService {
  private searchImpList: Array<{ type: SearchImplType; impl: SearchServiceImpl }>;

  private get crawlerImpls() {
    return parseImplEnv(toolsEnv.CRAWLER_IMPLS);
  }

  private get crawlConcurrency() {
    return toolsEnv.CRAWL_CONCURRENCY ?? DEFAULT_CRAWL_CONCURRENCY;
  }

  private get crawlerRetry() {
    return toolsEnv.CRAWLER_RETRY ?? DEFAULT_CRAWLER_RETRY;
  }

  constructor() {
    const impls = this.searchImpls;
    this.searchImpList =
      impls.length > 0
        ? impls.map((impl) => ({ type: impl, impl: createSearchServiceImpl(impl) }))
        : [{ type: SearchImplType.SearXNG, impl: createSearchServiceImpl() }];
  }

  async crawlPages(input: { impls?: CrawlImplType[]; provider?: CrawlImplType; urls: string[] }) {
    const { Crawler } = await import('@lobechat/web-crawler');

    // Determine which impl to use
    let impl: CrawlImplType;
    if (input.provider) {
      impl = input.provider;
    } else if (input.impls && input.impls.length > 0) {
      impl = input.impls[0];
    } else {
      impl = (this.crawlerImpls[0] || 'naive') as CrawlImplType;
    }

    const crawler = new Crawler({ impl });

    const results = await pMap(
      input.urls,
      async (url) => {
        return await this.crawlWithRetry(crawler, url);
      },
      { concurrency: this.crawlConcurrency },
    );

    return { results };
  }

  private async crawlWithRetry(crawler: Crawler, url: string): Promise<CrawlUniformResult> {
    const maxAttempts = this.crawlerRetry + 1;
    let lastResult: CrawlUniformResult | undefined;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await crawler.crawl({ url });
        lastResult = result;

        if (!this.isFailedCrawlResult(result)) {
          return result;
        }
      } catch (error) {
        lastError = error as Error;
      }
    }

    if (lastResult) {
      return lastResult;
    }

    return {
      crawler: 'unknown',
      data: {
        content: `Fail to crawl the page. Error type: ${lastError?.name || 'UnknownError'}, error message: ${lastError?.message}`,
        errorMessage: lastError?.message,
        errorType: lastError?.name || 'UnknownError',
      },
      originalUrl: url,
    };
  }

  /**
   * A successful crawl result always includes `contentType` (e.g. 'text', 'json')
   * in `result.data`, while a failed result contains `errorType`/`errorMessage` instead.
   */
  private isFailedCrawlResult(result: CrawlUniformResult): boolean {
    return !('contentType' in result.data);
  }

  private get searchImpls() {
    return parseImplEnv(toolsEnv.SEARCH_PROVIDERS) as SearchImplType[];
  }

  /**
   * Query for search results using the specified impl
   */
  private async queryWithImpl(impl: SearchServiceImpl, query: string, params?: SearchParams) {
    try {
      return await impl.query(query, params);
    } catch (e) {
      console.error('[SearchService] query failed:', (e as Error).message);
      return {
        costTime: 0,
        errorDetail: (e as Error).message,
        query,
        resultNumbers: 0,
        results: [],
      };
    }
  }

  /**
   * Query for search results (uses the first provider)
   */
  async query(query: string, params?: SearchParams) {
    const impl = this.searchImpList[0]?.impl;
    if (!impl) {
      return { costTime: 0, query, resultNumbers: 0, results: [] };
    }
    return this.queryWithImpl(impl, query, params);
  }

  async webSearch({
    query,
    searchCategories,
    searchEngines,
    searchTimeRange,
    provider,
  }: SearchQuery) {
    let implItem: { type: SearchImplType; impl: SearchServiceImpl } | undefined;

    // If provider is specified, use that provider
    if (provider) {
      implItem = this.searchImpList.find((item) => item.type === provider);
      if (!implItem) {
        console.warn(
          `[SearchService] Provider "${provider}" not found, using first available provider`,
        );
      }
    }

    // Use the first available provider if no specific provider or not found
    if (!implItem) {
      implItem = this.searchImpList[0];
    }

    if (!implItem) {
      return { costTime: 0, query, resultNumbers: 0, results: [] };
    }

    return await this.queryWithImpl(implItem.impl, query, {
      searchCategories,
      searchEngines,
      searchTimeRange,
    });
  }
}

// Add a default exported instance for convenience
export const searchService = new SearchService();
