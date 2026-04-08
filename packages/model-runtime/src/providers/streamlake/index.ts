import { ModelProvider } from 'model-bank';

import { createOpenAICompatibleRuntime } from '../../core/openaiCompatibleFactory';

export const LobeStreamLakeAI = createOpenAICompatibleRuntime({
  baseURL: 'https://wanqing.streamlakeapi.com/api/gateway/v1/endpoints',
  debug: {
    chatCompletion: () => process.env.DEBUG_STREAMLAKE_CHAT_COMPLETION === '1',
  },
  provider: ModelProvider.StreamLake,
});
