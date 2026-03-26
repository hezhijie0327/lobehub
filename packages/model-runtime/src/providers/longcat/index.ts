import { ModelProvider } from 'model-bank';

import { createOpenAICompatibleRuntime } from '../../core/openaiCompatibleFactory';
import { parseDataUri } from '../../utils/uriParser';

export const LobeLongCatAI = createOpenAICompatibleRuntime({
  baseURL: 'https://api.longcat.chat/openai/v1',
  chatCompletion: {
    handlePayload: (payload) => {
      const { frequency_penalty, messages, model, presence_penalty, ...rest } = payload;

      const omniMessages = messages?.map((message: any) => {
        // If content is a string, convert to LongCat array format
        if (typeof message?.content === 'string') {
          return {
            ...message,
            content: [
              {
                text: message.content,
                type: 'text',
              },
            ],
          };
        }

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

              const { type } = parseDataUri(imageUrl);

              return {
                input_image: {
                  data: type === 'url' ? [imageUrl] : imageUrl,
                  type: type === 'url' ? 'url' : 'base64',
                },
                type: 'input_image',
              };
            }

            if (item?.type === 'video_url') {
              const videoUrl = item.video_url?.url;

              if (!videoUrl) return item;

              const { type } = parseDataUri(videoUrl);

              return {
                input_video: {
                  data: videoUrl,
                  type: type === 'url' ? 'url' : 'base64',
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
        model,
        presence_penalty: undefined,
        ...(model.includes('omni')
          ? { messages: omniMessages, output_modalities: ['text'], stream: false }
          : { messages, stream: true }),
      } as any;
    },
  },
  debug: {
    chatCompletion: () => process.env.DEBUG_LONGCAT_CHAT_COMPLETION === '1',
  },
  provider: ModelProvider.LongCat,
});
