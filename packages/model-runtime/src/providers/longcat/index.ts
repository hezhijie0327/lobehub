import { ModelProvider } from 'model-bank';

import { createOpenAICompatibleRuntime } from '../../core/openaiCompatibleFactory';

export const LobeLongCatAI = createOpenAICompatibleRuntime({
  baseURL: 'https://api.longcat.chat/openai/v1',
  chatCompletion: {
    handlePayload: (payload) => {
      const { frequency_penalty, presence_penalty, ...rest } = payload;

      const messages = payload.messages?.map((message: any) => {
        if (!Array.isArray(message?.content)) return message;

        return {
          ...message,
          content: message.content.map((item: any) => {
            if (item?.type === 'text') {
              return {
                text: item.text ?? '',
                type: 'text',
              };
            }

            if (item?.type === 'image_url') {
              const imageUrl = item.image_url?.url;

              if (!imageUrl) return item;

              const isUrl = imageUrl.startsWith('http');

              return {
                input_image: {
                  data: isUrl ? [imageUrl] : imageUrl,
                  type: isUrl ? 'url' : 'base64',
                },
                type: 'input_image',
              };
            }

            if (item?.type === 'video_url') {
              const videoUrl = item.video_url?.url;

              if (!videoUrl) return item;

              const isUrl = videoUrl.startsWith('http');

              return {
                input_video: {
                  data: videoUrl,
                  type: isUrl ? 'url' : 'base64',
                },
                type: 'input_video',
              };
            }

            return item;
          }),
        };
      });

      return {
        ...rest,
        frequency_penalty: undefined,
        messages,
        presence_penalty: undefined,
        // if payload.model contains omni, then add output_modalities and stream
        ...(payload.model.includes('omni') ? { output_modalities: ['text'], stream: false } : {}),
      } as any;
    },
  },
  debug: {
    chatCompletion: () => process.env.DEBUG_LONGCAT_CHAT_COMPLETION === '1',
  },
  provider: ModelProvider.LongCat,
});
