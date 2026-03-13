import { ModelProvider } from 'model-bank';

import { transformLongCatMessage } from '../../core/contextBuilders/longcat';
import { createOpenAICompatibleRuntime } from '../../core/openaiCompatibleFactory';

export const LobeLongCatAI = createOpenAICompatibleRuntime({
  baseURL: 'https://api.longcat.chat/openai/v1',
  chatCompletion: {
    handlePayload: (payload) => {
      const { frequency_penalty, presence_penalty, ...rest } = payload;

      return {
        ...rest,
        ...(payload.model.includes('Omni') && {
          messages: payload.messages.map((message) => ({
            ...message,
            content: transformLongCatMessage(message.content),
          })),
          output_modalities: ['text'],
        }),
        frequency_penalty: undefined,
        presence_penalty: undefined,
        stream: true,
      } as any;
    },
  },
  debug: {
    chatCompletion: () => process.env.DEBUG_LONGCAT_CHAT_COMPLETION === '1',
  },
  provider: ModelProvider.LongCat,
});
