import { toolsEnv } from '@/envs/tools';
import { SearchImplType } from '@/server/services/search/impls';

/**
 * Parse impl env string (handle full-width commas and extra whitespace)
 */
const parseImplEnv = (envString: string = '') => {
  const envValue = envString.replaceAll('，', ',').trim();
  return envValue.split(',').filter(Boolean);
};

/**
 * Parse SEARCH_PROVIDERS env and get available providers
 */
export const getAvailableSearchProviders = (): string[] => {
  const envString = toolsEnv.SEARCH_PROVIDERS;
  const providers = parseImplEnv(envString || '') as SearchImplType[];
  return providers.length > 0 ? providers : [SearchImplType.SearXNG];
};

/**
 * Parse CRAWLER_IMPLS env and get available providers
 */
export const getAvailableCrawlProviders = (): string[] => {
  const envString = toolsEnv.CRAWLER_IMPLS;
  const providers = parseImplEnv(envString || '');
  return providers.length > 0 ? providers : ['browserless'];
};
