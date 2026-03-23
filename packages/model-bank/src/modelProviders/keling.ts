import type { ModelProviderCard } from '@/types/llm';

const Keling: ModelProviderCard = {
  chatModels: [],
  description:
    'Keling AI is a powerful image generation platform offering advanced AI-driven visual creation capabilities.',
  enabled: true,
  id: 'keling',
  name: 'Keling',
  settings: {
    disableBrowserRequest: true,
    showAddNewModel: false,
    showChecker: false,
    showModelFetcher: false,
  },
  url: 'https://klingai.com/',
};

export default Keling;
