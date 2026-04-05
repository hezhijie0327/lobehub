import type { BuiltinToolManifest } from '@lobechat/types';
import dayjs from 'dayjs';

import { systemPrompt } from './systemRole';
import { WebBrowsingApiName } from './types';

export const SEARCH_PROVIDER_ENUM = [
  'anspire',
  'bocha',
  'brave',
  'exa',
  'firecrawl',
  'google',
  'jina',
  'kagi',
  'search1api',
  'searxng',
  'tavily',
] as const;

export const CRAWL_PROVIDER_ENUM = [
  'browserless',
  'exa',
  'firecrawl',
  'jina',
  'naive',
  'search1api',
  'tavily',
] as const;

interface WebBrowsingManifestOptions {
  crawlProvidersEnv?: string;
  searchProvidersEnv?: string;
}

const parseProviderEnv = (envValue?: string) => {
  return (envValue || '')
    .replaceAll('，', ',')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const filterProviders = <T extends string>(availableProviders: readonly T[], envValue?: string) => {
  const enabledProviders = new Set(parseProviderEnv(envValue));

  return availableProviders.filter((provider) => enabledProviders.has(provider));
};

const updateProviderItems = <T extends string>(
  properties: Record<string, any>,
  key: 'crawlProvider' | 'searchProvider',
  availableProviders: readonly T[],
  envValue?: string,
) => {
  const configuredProviders = filterProviders(availableProviders, envValue);

  if (configuredProviders.length > 0) {
    properties[key] = {
      ...(properties[key] as object),
      enum: configuredProviders,
      type: 'string',
    };
  } else {
    delete properties[key];
  }
};

export const WebBrowsingManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'a search service. Useful for when you need to answer questions about current events. Input should be a search query. Output is a JSON array of the query results',
      name: WebBrowsingApiName.search,
      parameters: {
        properties: {
          query: {
            description: 'The search query',
            type: 'string',
          },
          searchCategories: {
            description: 'The search categories you can set:',
            items: {
              enum: ['general', 'images', 'news', 'science', 'videos'],
              type: 'string',
            },
            type: 'array',
          },
          searchProvider: {
            description: 'The search provider you can use:',
            enum: [],
            type: 'string',
          },
          searchEngines: {
            description: 'The search engines you can use:',
            items: {
              enum: [
                'google',
                'bilibili',
                'bing',
                'duckduckgo',
                'npm',
                'pypi',
                'github',
                'arxiv',
                'google scholar',
                'z-library',
                'reddit',
                'imdb',
                'brave',
                'wikipedia',
                'pinterest',
                'unsplash',
                'vimeo',
                'youtube',
              ],
              type: 'string',
            },
            type: 'array',
          },
          searchTimeRange: {
            description: 'The time range you can set:',
            enum: ['anytime', 'day', 'week', 'month', 'year'],
            type: 'string',
          },
        },
        required: ['query'],
        type: 'object',
      },
    },
    {
      description:
        'A crawler can visit page content. Output is a JSON object of title, content, url and website',
      name: WebBrowsingApiName.crawlSinglePage,
      parameters: {
        properties: {
          crawlProvider: {
            description: 'The crawl provider you can use:',
            enum: [],
            type: 'string',
          },
          url: {
            description: 'The url need to be crawled',
            type: 'string',
          },
        },
        required: ['url'],
        type: 'object',
      },
    },
    {
      description:
        'A crawler can visit multi pages. If need to visit multi website, use this one. Output is an array of JSON object of title, content, url and website',
      name: WebBrowsingApiName.crawlMultiPages,
      parameters: {
        properties: {
          crawlProvider: {
            description: 'The crawl provider you can use:',
            enum: [],
            type: 'string',
          },
          urls: {
            items: {
              description: 'The urls need to be crawled',
              type: 'string',
            },
            type: 'array',
          },
        },
        required: ['urls'],
        type: 'object',
      },
    },
  ],
  identifier: 'lobe-web-browsing',
  meta: {
    avatar: '🌐',
    description:
      'Search the web for current information and crawl web pages to extract content. Supports multiple search engines, categories, and time ranges.',
    readme:
      'Search the web for current information and crawl web pages to extract content. Supports multiple search engines, categories, and time ranges for comprehensive research.',
    title: 'Web Browsing',
  },
  systemRole: systemPrompt(dayjs(new Date()).format('YYYY-MM-DD')),
  type: 'builtin',
};

export const createWebBrowsingManifest = (
  options: WebBrowsingManifestOptions = {},
): BuiltinToolManifest => {
  const searchProviders = parseProviderEnv(options.searchProvidersEnv);
  const crawlProviders = parseProviderEnv(options.crawlProvidersEnv);

  const api = WebBrowsingManifest.api.map((apiItem) => {
    const properties = { ...apiItem.parameters?.properties };

    if ('searchProvider' in properties) {
      updateProviderItems(
        properties,
        'searchProvider',
        SEARCH_PROVIDER_ENUM,
        options.searchProvidersEnv,
      );
    }

    if ('crawlProvider' in properties) {
      updateProviderItems(
        properties,
        'crawlProvider',
        CRAWL_PROVIDER_ENUM,
        options.crawlProvidersEnv,
      );
    }

    return {
      ...apiItem,
      parameters: {
        ...apiItem.parameters,
        properties,
      },
    };
  });

  return {
    ...WebBrowsingManifest,
    api,
    systemRole: systemPrompt(dayjs(new Date()).format('YYYY-MM-DD'), {
      enabledCrawlProviders: crawlProviders,
      enabledSearchProviders: searchProviders,
    }),
  };
};
