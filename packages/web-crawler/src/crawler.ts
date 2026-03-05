import { CrawlProviderType } from '@lobechat/types';

import type { CrawlImplType } from './crawImpl';
import { crawlImpls } from './crawImpl';
import type { CrawlUniformResult, CrawlUrlRule } from './type';
import { crawUrlRules } from './urlRules';
import { applyUrlRules } from './utils/appUrlRules';

interface CrawlOptions {
  impl?: string;
}

export class Crawler {
  impl: CrawlImplType;

  constructor(options: CrawlOptions = {}) {
    this.impl =
      options.impl && Object.keys(crawlImpls).includes(options.impl)
        ? (options.impl as CrawlImplType)
        : CrawlProviderType.Browserless;
  }

  /**
   * Crawl webpage content
   * @param options Crawl options
   */
  async crawl({
    url,
    filterOptions: userFilterOptions,
  }: {
    filterOptions?: CrawlUrlRule['filterOptions'];
    url: string;
  }): Promise<CrawlUniformResult> {
    // Apply URL rules
    const {
      transformedUrl,
      filterOptions: ruleFilterOptions,
      impls: ruleImpls,
    } = applyUrlRules(url, crawUrlRules);

    // Use rule impls if available, otherwise use configured impl
    const impl = (ruleImpls?.[0] ?? this.impl) as CrawlImplType;

    // Merge user-provided filter options and rule filter options, user options take priority
    const mergedFilterOptions = {
      ...ruleFilterOptions,
      ...userFilterOptions,
    };

    try {
      const res = await crawlImpls[impl](transformedUrl, { filterOptions: mergedFilterOptions });

      if (res && res.content && res.content.length > 100) {
        return {
          crawler: impl,
          data: res,
          originalUrl: url,
          transformedUrl: transformedUrl !== url ? transformedUrl : undefined,
        };
      }

      const error = new Error(`${impl} returned empty or short content`);
      error.name = 'EmptyCrawlResultError';

      return {
        crawler: impl,
        data: {
          content: `Fail to crawl page. Error type: ${error.name}, error message: ${error.message}`,
          errorMessage: error.message,
          errorType: error.name,
        },
        originalUrl: url,
        transformedUrl: transformedUrl !== url ? transformedUrl : undefined,
      };
    } catch (error) {
      console.error(error);
      const errorType = (error as Error).name || 'UnknownError';
      const errorMessage = (error as Error).message;

      return {
        crawler: impl,
        data: {
          content: `Fail to crawl page. Error type: ${errorType}, error message: ${errorMessage}`,
          errorMessage,
          errorType,
        },
        originalUrl: url,
        transformedUrl: transformedUrl !== url ? transformedUrl : undefined,
      };
    }
  }
}
