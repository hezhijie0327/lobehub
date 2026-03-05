const parseImplEnv = (envString: string = '') => {
  const envValue = envString.replaceAll('，', ',').trim();
  return envValue.split(',').filter(Boolean);
};

const getSearchProviders = () => {
  try {
    if (typeof process !== 'undefined' && process?.env?.SEARCH_PROVIDERS) {
      const providers = parseImplEnv(process.env.SEARCH_PROVIDERS);
      if (providers.length > 0) {
        return providers;
      }
    }
  } catch {}
  return ['searxng'];
};

const getCrawlerImpls = () => {
  try {
    if (typeof process !== 'undefined' && process?.env?.CRAWLER_IMPLS) {
      const impls = parseImplEnv(process.env.CRAWLER_IMPLS);
      if (impls.length > 0) {
        return impls;
      }
    }
  } catch {}
  return ['jina'];
};

export { getCrawlerImpls, getSearchProviders, parseImplEnv };
